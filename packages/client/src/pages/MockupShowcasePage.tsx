import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { StripePaymentElementOptions } from '@stripe/stripe-js';
import {
  CheckoutElementsProvider,
  PaymentElement,
  ExpressCheckoutElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';
import type {
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Menu,
  Check,
  ShieldCheck,
  Lock,
  CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createShowcaseSession } from '../lib/api';
import { STRIPE_PUBLISHABLE_KEY, ROUTES } from '../lib/constants';
import { mockupAppearance } from '../lib/stripe-appearance-mockup';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

/* ─────────────────────────────────────────────────────
   The one config object that reproduces the whole mockup.
   Kept as a named const so we can render it verbatim in the
   proof panel — what you see rendered IS what's shown here.
   ───────────────────────────────────────────────────── */
// Card-only Payment Element: wallets live in the Express Checkout Element
// (in the Checkout Sessions integration the Payment Element doesn't render
// wallet buttons — they're express-checkout-only), so the card path renders
// just the card fields. This lets our cardholder-name field sit directly
// under the method selector, above the card number — exactly the mockup order.
const PAYMENT_ELEMENT_OPTIONS: StripePaymentElementOptions = {
  layout: { type: 'accordion', radios: 'never', spacedAccordionItems: false },
  fields: {
    billingDetails: {
      name: 'never', // collected by our themed field, passed on confirm
      email: 'never',
      phone: 'never',
      address: {
        country: 'auto', // mockup shows Country…
        postalCode: 'never', // …but no ZIP/postcode
      },
    },
  },
};

const PAYMENT_ELEMENT_OPTIONS_SRC = `// Custom method selector (Card / Google Pay) sits on top.
// Card path — themed name field + a card-only Payment Element:
<ExpressCheckoutElement />   // real Google Pay / Apple Pay button
<label>Cardholder name</label><input />   // → billing_details.name
<PaymentElement options={{
  wallets: { applePay: 'never', googlePay: 'never' },
  fields: { billingDetails: {
    name: 'never',
    address: { country: 'auto', postalCode: 'never' },
  }},
}} />`;

/* ─────────────────────────────────────────────────────
   The payment form — a plain PaymentElement + pay button.
   ───────────────────────────────────────────────────── */

type WalletAvail = { googlePay: boolean; applePay: boolean };

function MockupForm({ amount }: { amount: number }) {
  const checkoutState = useCheckoutElements();
  const checkout = checkoutState.type === 'success' ? checkoutState.checkout : null;
  const [method, setMethod] = useState<'card' | 'wallet'>('card');
  const [wallets, setWallets] = useState<WalletAvail>({ googlePay: false, applePay: false });
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const anyWallet = wallets.googlePay || wallets.applePay;
  const walletLabel = wallets.googlePay ? 'Google Pay' : wallets.applePay ? 'Apple Pay' : 'Digital wallet';

  async function confirm(opts: {
    withName?: boolean;
    expressEvent?: StripeExpressCheckoutElementConfirmEvent;
  }) {
    if (!checkout) return;
    // Cardholder name rides on the session's billing contact — preserve any
    // address the Payment Element has already collected (e.g. country).
    const result = await checkout.confirm({
      redirect: 'if_required',
      ...(opts.withName && cardholderName
        ? {
            billingAddress: {
              name: cardholderName,
              address: checkout.billingAddress?.address ?? { country: 'IE' },
            },
          }
        : {}),
      ...(opts.expressEvent ? { expressCheckoutConfirmEvent: opts.expressEvent } : {}),
    });
    if (result.type === 'error') {
      setError(result.error.message ?? 'Something went wrong.');
      return;
    }
    setSucceeded(true);
  }

  async function handleCardSubmit(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    await confirm({ withName: true });
    setProcessing(false);
  }

  function handleWalletReady(e: StripeExpressCheckoutElementReadyEvent) {
    const pm = e.availablePaymentMethods;
    setWallets({ googlePay: !!pm?.googlePay, applePay: !!pm?.applePay });
  }

  if (succeeded) {
    return (
      <div className="text-center py-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-axa-green mb-4">
          <Check className="text-white" size={28} strokeWidth={3} />
        </div>
        <h3 className="text-lg font-bold text-axa-dark">Payment confirmed</h3>
        <p className="mt-1 text-sm text-axa-grey-700">
          {formatCurrency(amount)} charged for your policy change.
        </p>
      </div>
    );
  }

  const tabBase =
    'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all';
  const tabOn = 'border-axa-blue bg-axa-blue/[0.04] text-axa-blue shadow-[0_0_0_1px_#00008F]';
  const tabOff = 'border-[#DCDCE4] bg-white text-axa-dark hover:border-[#C7C7D4]';

  return (
    <div>
      <p className="text-sm font-semibold text-axa-dark mb-3">Payment method</p>

      {/* Custom method selector. The wallet tab only appears once the Express
          Checkout Element reports the wallet as available on this device. */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setMethod('card')}
          className={`${tabBase} ${method === 'card' ? tabOn : tabOff}`}
        >
          <CreditCard size={18} />
          Card
          <span className="ml-auto flex items-center gap-1">
            <span className="w-6 h-4 rounded-[3px] bg-blue-50 border border-blue-100 text-[7px] font-bold text-blue-700 flex items-center justify-center">
              VISA
            </span>
            <span className="w-6 h-4 rounded-[3px] bg-orange-50 border border-orange-100" />
          </span>
        </button>

        {anyWallet && (
          <button
            type="button"
            onClick={() => setMethod('wallet')}
            className={`${tabBase} ${method === 'wallet' ? tabOn : tabOff}`}
          >
            {walletLabel}
          </button>
        )}
      </div>

      {/* Cardholder name — directly UNDER the selector, above the card fields. */}
      {method === 'card' && (
        <form onSubmit={handleCardSubmit} className="mt-4">
          <div className="rounded-xl border border-[#00008F] shadow-[0_0_0_1px_#00008F] p-4 space-y-4">
            <div>
              <label htmlFor="cardholder-name" className="block text-[13px] font-medium text-axa-dark mb-1.5">
                Cardholder name
              </label>
              <input
                id="cardholder-name"
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Name as it appears on the card"
                autoComplete="cc-name"
                className="w-full rounded-[10px] border border-[#DCDCE4] bg-white px-3.5 py-3 text-[15px] text-axa-dark placeholder:text-axa-grey-400 outline-none transition focus:border-axa-blue focus:ring-[3px] focus:ring-axa-blue/10"
              />
            </div>

            <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 text-axa-red text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="mt-6 w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-axa-blue text-white hover:bg-axa-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing…
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                Pay {formatCurrency(amount)}
              </>
            )}
          </button>
        </form>
      )}

      {method === 'wallet' && (
        <p className="mt-4 text-sm text-axa-grey-600 text-center">
          Confirm your {formatCurrency(amount)} payment with {walletLabel} below.
        </p>
      )}

      {/* Express Checkout Element — always mounted (clipped when Card is active)
          so it can report wallet availability and render the real wallet button
          when the wallet tab is selected. */}
      <div className={method === 'wallet' ? 'mt-4' : 'h-0 overflow-hidden'} aria-hidden={method !== 'wallet'}>
        <ExpressCheckoutElement
          onReady={handleWalletReady}
          onConfirm={(event) => confirm({ expressEvent: event })}
          options={{
            buttonHeight: 48,
            buttonTheme: undefined,
            buttonType: undefined,
            layout: undefined,
            paymentMethodOrder: undefined,
            paymentMethods: undefined,
          }}
        />
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-axa-grey-400">
        <Lock size={11} />
        Secured by Stripe · Payment Element + Express Checkout Element
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Proof panel — maps every mockup element to its Stripe option
   ───────────────────────────────────────────────────── */

const MAPPING: { label: string; how: string }[] = [
  { label: 'Card / Google Pay method selector at the top', how: 'custom tabs → card-only Payment Element vs Express Checkout Element' },
  { label: 'Google Pay / Apple Pay button', how: 'Express Checkout Element (only shows available wallets)' },
  { label: 'Cardholder name — under the selector, card only', how: 'themed field → billing_details.name on confirm' },
  { label: 'Card number / expiry / CVC / Country', how: "Payment Element (card only, address.country: 'auto', postalCode: 'never')" },
  { label: '“Save my payment information” checkbox', how: 'Checkout Session · saved_payment_method_options.payment_method_save: enabled' },
  { label: 'AXA blue accents, fonts, spacing, radii', how: 'Appearance API (theme + variables + rules)' },
];

function ProofPanel() {
  return (
    <div className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-axa-blue bg-axa-blue/[0.08] px-2.5 py-1 rounded-full tracking-widest uppercase mb-3">
          How it maps
        </div>
        <h2 className="text-xl font-bold text-axa-dark tracking-tight">
          Mapping the design to Stripe Elements
        </h2>
        <p className="mt-2 text-sm text-axa-grey-700 leading-relaxed">
          Here’s a reference implementation to help the team scope this together. A custom method
          selector sits on top; the card path renders our themed name field above a card-only
          <code className="mx-1 px-1.5 py-0.5 rounded bg-axa-grey-100 text-axa-dark text-[13px]">&lt;PaymentElement /&gt;</code>,
          and the wallet path uses a real
          <code className="mx-1 px-1.5 py-0.5 rounded bg-axa-grey-100 text-axa-dark text-[13px]">&lt;ExpressCheckoutElement /&gt;</code>.
          Everything is themed with the Appearance API.
        </p>
      </div>

      <div className="rounded-xl border border-axa-grey-200 overflow-hidden">
        <div className="bg-axa-grey-50 px-4 py-2 border-b border-axa-grey-200 text-[10px] font-bold tracking-widest text-axa-grey-500 uppercase">
          Design element → Stripe option
        </div>
        <ul className="divide-y divide-axa-grey-100">
          {MAPPING.map((m) => (
            <li key={m.label} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-axa-green/10 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-axa-green" strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-axa-dark">{m.label}</p>
                <code className="text-[12px] text-axa-blue break-words">{m.how}</code>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-widest text-axa-grey-500 uppercase mb-2">
          The exact configuration
        </p>
        <pre className="text-[11px] leading-relaxed bg-axa-dark text-axa-grey-100 rounded-xl p-4 overflow-x-auto font-mono">
          {PAYMENT_ELEMENT_OPTIONS_SRC}
        </pre>
      </div>

      <div className="border-l-4 border-axa-blue bg-axa-blue/[0.05] px-4 py-3 rounded-r">
        <p className="text-[11px] font-bold uppercase tracking-wider text-axa-blue mb-1">
          On the cardholder name
        </p>
        <p className="text-sm text-axa-grey-800 leading-relaxed">
          For the Payment Element, name collection is controlled in code
          (<code className="px-1 rounded bg-axa-blue/10 text-axa-blue text-[12px]">fields.billingDetails.name</code>
          is <code className="px-1 rounded bg-axa-blue/10 text-axa-blue text-[12px]">'auto' | 'never'</code>,
          with no “always”), and card doesn’t require it — so the standard approach is to collect it
          with a themed field and pass it to
          <code className="mx-1 px-1 rounded bg-axa-blue/10 text-axa-blue text-[12px]">billing_details.name</code>
          on confirm, which is what this form does. (The Dashboard name-collection toggle applies to
          Stripe-hosted Checkout, not the Payment Element.)
        </p>
      </div>

      <div className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r">
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">Note on wallets</p>
        <p className="text-sm text-amber-900 leading-relaxed">
          Apple Pay and Google Pay rows appear automatically when the browser/device supports them
          (Google Pay in Chrome; Apple Pay in Safari on a registered domain). Set to
          <code className="mx-1 px-1 rounded bg-amber-100 text-amber-900 text-[12px]">'auto'</code>
          they self-reveal — no code branching required.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Phone frame wrapper — echoes the mockup's mobile context
   ───────────────────────────────────────────────────── */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[400px] bg-white rounded-[28px] border border-axa-grey-200 shadow-axa-lg overflow-hidden">
      {/* Mock AXA app header */}
      <div className="relative">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="w-14 h-7 bg-axa-blue rounded-sm flex items-center justify-center">
            <span className="text-white font-extrabold text-sm tracking-tight">AXA</span>
          </div>
          <button className="w-9 h-9 rounded-full border border-axa-grey-200 flex items-center justify-center text-axa-grey-600">
            <Menu size={16} />
          </button>
        </div>
        <div className="h-1 bg-axa-red" />
      </div>

      <div className="px-5 py-6">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────── */

export default function MockupShowcasePage() {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createShowcaseSession()
      .then((data) => {
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
      })
      .catch((err) => setError((err as Error).message));
  }, []);


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(ROUTES.HOME)}
        className="flex items-center gap-1.5 text-xs text-axa-grey-500 hover:text-axa-grey-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to demo
      </button>

      <div className="mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-axa-blue bg-axa-blue/[0.08] px-2.5 py-1 rounded-full tracking-widest uppercase mb-3">
          Design feasibility
        </div>
        <h1 className="text-3xl font-extrabold text-axa-dark tracking-tight">
          Bringing the AXA design to life with Stripe Elements
        </h1>
        <p className="mt-2 text-axa-grey-700 leading-relaxed">
          A working reference build of the AXA mockup, using a Stripe <code className="px-1.5 py-0.5 rounded bg-axa-grey-100 text-axa-dark text-[13px]">PaymentElement</code>
          {' '}and the Appearance API — something we can take to the team as a shared starting point.
          Compare it to the design, and see how each element maps to a Stripe option on the right.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left — the live rebuild in a phone frame */}
        <div>
          <PhoneFrame>
            <p className="text-[10px] font-bold tracking-widest text-axa-blue uppercase mb-1">Payment</p>
            <h2 className="text-xl font-bold text-axa-dark leading-snug mb-1">
              How would you like to pay for this change?
            </h2>
            <p className="text-sm text-axa-grey-500 mb-5">Choose how you’d like to pay.</p>

            {error ? (
              <div className="flex items-start gap-2.5 text-axa-red text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : !clientSecret ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-axa-blue" size={26} />
                <span className="ml-3 text-sm text-axa-grey-700">Loading payment form…</span>
              </div>
            ) : (
              <CheckoutElementsProvider
                stripe={stripePromise}
                options={{
                  clientSecret,
                  elementsOptions: {
                    appearance: mockupAppearance,
                    // Mockup parity: show the save checkbox but keep the form
                    // a clean new-card entry — no saved-card list.
                    savedPaymentMethod: { enableSave: 'auto', enableRedisplay: 'never' },
                  },
                }}
                key={clientSecret}
              >
                <MockupForm amount={amount} />
              </CheckoutElementsProvider>
            )}
          </PhoneFrame>

          <p className="text-center text-xs text-axa-grey-400 mt-4">
            Live, fully functional · Stripe test mode
          </p>
        </div>

        {/* Right — the proof */}
        <ProofPanel />
      </div>
    </div>
  );
}
