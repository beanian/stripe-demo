import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Loader2,
  AlertCircle,
  CreditCard,
  Check,
  Plus,
  Trash2,
  Shield,
  Star,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  listWallet,
  createWalletSetupIntent,
  setDefaultCard,
  detachCard,
} from '../lib/api';
import { STRIPE_PUBLISHABLE_KEY, ROUTES } from '../lib/constants';
import { axaAppearance } from '../lib/stripe-appearance';
import type { SavedCard } from '../types/stripe';
import {
  IntegrationSpotlightProvider,
  IntegrationAnchor,
  useSpotlight,
} from '../components/integration/IntegrationSpotlight';
import { WALLET_SPEC_IDS } from '../components/integration/integration-specs';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/* ─────────────────────────────────────────────────────
   Card brand visual helpers
   ───────────────────────────────────────────────────── */

const BRAND_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

const BRAND_TINT: Record<string, string> = {
  visa: 'from-blue-500 to-blue-700',
  mastercard: 'from-orange-500 to-red-600',
  amex: 'from-slate-600 to-slate-800',
  discover: 'from-orange-400 to-orange-600',
  diners: 'from-slate-500 to-slate-700',
  jcb: 'from-emerald-500 to-emerald-700',
  unionpay: 'from-rose-500 to-rose-700',
  unknown: 'from-axa-grey-500 to-axa-grey-700',
};

function brandLabel(brand: string): string {
  return BRAND_LABEL[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

function brandTint(brand: string): string {
  return BRAND_TINT[brand] ?? BRAND_TINT.unknown;
}

function formatExpiry(month: number, year: number): string {
  if (!month || !year) return '—/—';
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
}

/* ─────────────────────────────────────────────────────
   Architectural-boundary tag — only visible when the spotlight is on
   ───────────────────────────────────────────────────── */

function SurfaceLabel({ kind, label }: { kind: 'custom' | 'stripe'; label: string }) {
  const { active } = useSpotlight();
  if (!active) return null;

  const cls =
    kind === 'custom'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200';

  return (
    <div
      className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase shadow-sm whitespace-nowrap ${cls}`}
    >
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Toast (transient)
   ───────────────────────────────────────────────────── */

type Toast = { id: number; tone: 'success' | 'error'; message: string };

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-axa-lg text-sm font-semibold animate-slide-up ${
            t.tone === 'success'
              ? 'bg-axa-green text-white'
              : 'bg-axa-red text-white'
          }`}
        >
          {t.tone === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Saved card row
   ───────────────────────────────────────────────────── */

function SavedCardRow({
  card,
  busyAction,
  onSetDefault,
  onRemove,
}: {
  card: SavedCard;
  busyAction: 'default' | 'remove' | null;
  onSetDefault: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative p-5 rounded-axa border transition-all ${
        card.isDefault
          ? 'border-axa-blue bg-axa-blue/[0.03] shadow-axa-md'
          : 'border-axa-grey-200 bg-white hover:border-axa-grey-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Card visual */}
        <div
          className={`relative flex-shrink-0 w-16 h-10 rounded-md bg-gradient-to-br ${brandTint(card.brand)} shadow-sm flex items-center justify-center`}
        >
          <CreditCard size={18} className="text-white/90" />
        </div>

        {/* Card details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-axa-dark">{brandLabel(card.brand)}</span>
            <span className="text-axa-grey-500 text-sm">•••• {card.last4}</span>
            {card.isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-axa-blue text-white text-[10px] font-bold tracking-wider uppercase">
                <Star size={9} fill="currentColor" />
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-axa-grey-500">
            Expires {formatExpiry(card.expMonth, card.expYear)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!card.isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              disabled={!!busyAction}
              className="text-xs font-semibold text-axa-blue hover:bg-axa-blue/10 px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {busyAction === 'default' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Set as default
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={!!busyAction || card.isDefault}
            title={card.isDefault ? 'Set another card as default first' : 'Remove this card'}
            className="text-axa-grey-400 hover:text-axa-red hover:bg-axa-red/10 p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {busyAction === 'remove' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Add-card panel — SetupIntent + PaymentElement
   ───────────────────────────────────────────────────── */

function AddCardForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Unable to save card.');
      setProcessing(false);
      return;
    }

    if (setupIntent?.status === 'succeeded') {
      onSuccess('Card saved to your wallet');
    } else {
      setError(`Unexpected setup status: ${setupIntent?.status ?? 'unknown'}`);
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <PaymentElement
        options={{
          layout: 'tabs',
          // Hide the "Save for future use" UX here — by virtue of being on the
          // wallet page, the user's intent is already to save.
          terms: { card: 'never' },
        }}
      />

      {error && (
        <div className="flex items-start gap-2.5 text-axa-red text-sm bg-red-50 border border-red-200 p-3 rounded-axa">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-axa-blue text-white font-semibold text-sm py-3 rounded-axa hover:bg-axa-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Saving card...
            </>
          ) : (
            <>
              <Shield size={16} />
              Save card to wallet
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-3 text-sm font-semibold text-axa-grey-700 hover:bg-axa-grey-100 rounded-axa transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────────────── */

export default function MyAxaWallet() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'default' | 'remove' | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((tone: Toast['tone'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, tone, message }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3500);
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await listWallet();
      setCards(data.cards);
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSetDefault(card: SavedCard) {
    setBusyCardId(card.id);
    setBusyAction('default');
    try {
      await setDefaultCard(card.id);
      await reload();
      pushToast('success', `${brandLabel(card.brand)} •••• ${card.last4} is now your default card`);
    } catch (err) {
      pushToast('error', (err as Error).message || 'Could not set default card');
    } finally {
      setBusyCardId(null);
      setBusyAction(null);
    }
  }

  async function handleRemove(card: SavedCard) {
    if (!window.confirm(`Remove ${brandLabel(card.brand)} •••• ${card.last4} from your wallet?`)) return;

    setBusyCardId(card.id);
    setBusyAction('remove');
    try {
      await detachCard(card.id);
      await reload();
      pushToast('success', `${brandLabel(card.brand)} •••• ${card.last4} removed`);
    } catch (err) {
      pushToast('error', (err as Error).message || 'Could not remove card');
    } finally {
      setBusyCardId(null);
      setBusyAction(null);
    }
  }

  async function openAddCard() {
    setAddOpen(true);
    setSetupLoading(true);
    try {
      const data = await createWalletSetupIntent();
      setSetupClientSecret(data.clientSecret);
    } catch (err) {
      pushToast('error', (err as Error).message || 'Could not start add-card flow');
      setAddOpen(false);
    } finally {
      setSetupLoading(false);
    }
  }

  function closeAddCard() {
    setAddOpen(false);
    setSetupClientSecret(null);
  }

  async function handleAddCardSuccess(message: string) {
    closeAddCard();
    await reload();
    pushToast('success', message);
  }

  return (
    <IntegrationSpotlightProvider specIds={WALLET_SPEC_IDS} toggleLabel="wallet integrations">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="flex items-center gap-1.5 text-xs text-axa-grey-500 hover:text-axa-grey-700 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to demo
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-axa-blue bg-axa-blue/[0.08] px-2.5 py-1 rounded-full tracking-widest uppercase mb-3">
            My AXA · Self-Serve
          </div>
          <h1 className="text-3xl font-extrabold text-axa-dark tracking-tight">Saved Cards</h1>
          <p className="mt-2 text-axa-grey-700 leading-relaxed">
            Manage the cards we hold for your motor insurance payments. Your default card is used for
            instalments and renewals.
          </p>
        </div>

        {/* Account header — pin #1: resolve policyholder to Stripe customer */}
        <IntegrationAnchor specId="wallet-resolve-customer" position="top-right">
          <div className="card-elevated p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-axa-blue/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-axa-blue" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest text-axa-grey-400 uppercase">Account</p>
              <p className="text-sm font-semibold text-axa-dark">John Murphy</p>
              <p className="text-xs text-axa-grey-500">Policy PH-00198432 · Comprehensive cover</p>
            </div>
          </div>
        </IntegrationAnchor>

        {loadError && (
          <div className="flex items-start gap-2.5 text-axa-red text-sm bg-red-50 border border-red-200 p-4 rounded-axa mb-6">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        <div className="card-elevated p-5">
          {/* Card list section — Custom AXA UI rendered from Stripe data */}
          <IntegrationAnchor specId="wallet-list" position="top-right">
            <IntegrationAnchor specId="wallet-set-default" position="bottom-right">
              <IntegrationAnchor specId="wallet-detach" position="bottom-left">
                <div className="relative">
                  {/* Architectural-boundary tag — visible whenever the spotlight is on */}
                  <SurfaceLabel kind="custom" label="Custom AXA UI · rendered from Stripe data" />

                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-axa-dark tracking-wide uppercase">
                      Your wallet
                    </h2>
                    {cards && (
                      <span className="text-xs text-axa-grey-500">
                        {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                      </span>
                    )}
                  </div>

                  {cards === null && !loadError ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="animate-spin text-axa-blue" size={24} />
                      <span className="ml-3 text-sm text-axa-grey-700">Loading wallet…</span>
                    </div>
                  ) : cards && cards.length === 0 ? (
                    <div className="text-center py-10">
                      <CreditCard size={32} className="text-axa-grey-300 mx-auto" />
                      <p className="mt-3 text-sm text-axa-grey-700">No cards saved yet.</p>
                      <p className="text-xs text-axa-grey-500 mt-1">
                        Add a card so we can collect your monthly instalments automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cards?.map((card) => (
                        <SavedCardRow
                          key={card.id}
                          card={card}
                          busyAction={busyCardId === card.id ? busyAction : null}
                          onSetDefault={() => handleSetDefault(card)}
                          onRemove={() => handleRemove(card)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </IntegrationAnchor>
            </IntegrationAnchor>
          </IntegrationAnchor>

          {/* Add-card section — separate anchor scope */}
          <div className="mt-5 pt-5 border-t border-axa-grey-200">
            {!addOpen ? (
              <button
                type="button"
                onClick={openAddCard}
                disabled={setupLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-axa border-2 border-dashed border-axa-grey-300 text-axa-blue font-semibold text-sm hover:border-axa-blue hover:bg-axa-blue/[0.03] transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                Add a new card
              </button>
            ) : setupLoading || !setupClientSecret ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-axa-blue" size={24} />
                <span className="ml-3 text-sm text-axa-grey-700">Preparing secure card form…</span>
              </div>
            ) : (
              <IntegrationAnchor specId="wallet-add-card" position="top-right">
                <div className="bg-axa-grey-50 rounded-axa p-4 -mx-2 relative">
                  <SurfaceLabel kind="stripe" label="Stripe Elements · PaymentElement (new card only)" />
                  <h3 className="text-xs font-bold tracking-widest text-axa-grey-500 uppercase mb-3">
                    Add a new card
                  </h3>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: setupClientSecret,
                      appearance: axaAppearance,
                    }}
                    key={setupClientSecret}
                  >
                    <AddCardForm onCancel={closeAddCard} onSuccess={handleAddCardSuccess} />
                  </Elements>
                </div>
              </IntegrationAnchor>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-axa-grey-500 leading-relaxed">
          Cards are stored securely by Stripe. AXA never sees your full card number. Setting a card as
          default tells Guidewire BillingCenter to use it for your next instalment. Toggle
          “wallet integrations” bottom-right to see exactly which calls MuleSoft must mediate.
        </p>

        <ToastStack
          toasts={toasts}
          onDismiss={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))}
        />
      </div>
    </IntegrationSpotlightProvider>
  );
}
