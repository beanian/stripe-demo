import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout';
import {
  Loader2,
  AlertCircle,
  CreditCard,
  Building2,
  CalendarClock,
  ShieldCheck,
  Lock,
  Shield,
  Car,
  User,
  CalendarDays,
  Sparkles,
  Check,
  ChevronRight,
  ArrowLeft,
  Repeat,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '../contexts/QuoteContext';
import { createElementsSession, createSepaSession, updateElementsSession } from '../lib/api';
import { STRIPE_PUBLISHABLE_KEY, QUOTE_ID, ROUTES } from '../lib/constants';
import { customAppearance } from '../lib/stripe-appearance-custom';
import TestCardsPanel from '../components/shared/TestCardsPanel';
import {
  IntegrationSpotlightProvider,
  IntegrationAnchor,
} from '../components/integration/IntegrationSpotlight';
import type { Quote, PaymentSchedule } from '../types/quote';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

type PbiMethod = 'card' | 'sepa';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function getInstalmentStartMonth(startDate: string): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
}

/* ═══════════════════════════════════════════════════════
   WIZARD STEP DEFINITIONS
   ═══════════════════════════════════════════════════════ */

type WizardStep = 'schedule' | 'pbi-method' | 'sepa' | 'card';

function getSteps(isDeposit: boolean, pbiMethod: PbiMethod): WizardStep[] {
  if (!isDeposit) return ['schedule', 'card'];
  if (pbiMethod === 'sepa') return ['schedule', 'pbi-method', 'sepa', 'card'];
  return ['schedule', 'pbi-method', 'card'];
}

function stepLabel(step: WizardStep): string {
  switch (step) {
    case 'schedule': return 'Choose Plan';
    case 'pbi-method': return 'PBI Method';
    case 'sepa': return 'Direct Debit';
    case 'card': return 'Card Payment';
  }
}

function stepIcon(step: WizardStep) {
  switch (step) {
    case 'schedule': return CalendarClock;
    case 'pbi-method': return Repeat;
    case 'sepa': return Building2;
    case 'card': return CreditCard;
  }
}

/* ═══════════════════════════════════════════════════════
   ANIMATED PROGRESS RAIL
   ═══════════════════════════════════════════════════════ */

function WizardProgress({
  steps,
  currentIdx,
}: {
  steps: WizardStep[];
  currentIdx: number;
}) {
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const Icon = stepIcon(step);
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={`
                  w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500
                  ${isCompleted
                    ? 'bg-axa-blue shadow-lg shadow-axa-blue/20'
                    : isCurrent
                      ? 'custom-glow-ring bg-white border-2 border-axa-blue'
                      : 'bg-axa-grey-100 border border-axa-grey-200'
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={18} className="text-white" strokeWidth={3} />
                ) : (
                  <Icon size={18} className={isCurrent ? 'text-axa-blue' : 'text-axa-grey-300'} />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap transition-colors duration-300 ${
                  isCompleted ? 'text-axa-blue' : isCurrent ? 'text-axa-dark' : 'text-axa-grey-400'
                }`}
              >
                {stepLabel(step)}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 mb-6 relative overflow-hidden rounded-full bg-axa-grey-200">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-axa-blue to-axa-blue/60 rounded-full transition-all duration-700 ease-out"
                  style={{ width: isCompleted ? '100%' : isCurrent ? '30%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIVE SIDEBAR SUMMARY
   ═══════════════════════════════════════════════════════ */

function LiveSummary({
  quote,
  schedule,
  amount,
  currentStep,
  pbiMethod,
}: {
  quote: Quote;
  schedule: PaymentSchedule;
  amount: number;
  currentStep: WizardStep;
  pbiMethod: PbiMethod;
}) {
  const isDeposit = schedule === 'deposit';
  const pastScheduleStep = currentStep !== 'schedule';
  const pastMethodStep = pastScheduleStep && currentStep !== 'pbi-method';

  return (
    <div className="custom-glass rounded-2xl p-6 sticky top-8 space-y-6">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-axa-blue" />
        <span className="text-[10px] font-bold tracking-[0.15em] text-axa-blue uppercase">Your Policy</span>
      </div>

      <div>
        <span className="text-4xl font-extrabold text-axa-dark tracking-tight">{formatCurrency(quote.annualPremium)}</span>
        <p className="text-xs text-axa-grey-500 mt-1 capitalize">{quote.coverType.replace(/-/g, ' ')} cover</p>
      </div>

      <div className="h-px bg-axa-grey-200" />

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-axa-grey-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User size={14} className="text-axa-grey-400" />
          </div>
          <div>
            <p className="text-[10px] text-axa-grey-400 uppercase tracking-widest font-semibold">Policyholder</p>
            <p className="text-sm font-medium text-axa-grey-800">{quote.customerName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-axa-grey-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Car size={14} className="text-axa-grey-400" />
          </div>
          <div>
            <p className="text-[10px] text-axa-grey-400 uppercase tracking-widest font-semibold">Vehicle</p>
            <p className="text-sm font-medium text-axa-grey-800">{quote.vehicleMake} {quote.vehicleModel}</p>
            <p className="text-xs text-axa-grey-400">{quote.vehicleReg} &middot; {quote.vehicleYear}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-axa-grey-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CalendarDays size={14} className="text-axa-grey-400" />
          </div>
          <div>
            <p className="text-[10px] text-axa-grey-400 uppercase tracking-widest font-semibold">Cover Period</p>
            <p className="text-sm font-medium text-axa-grey-800">{quote.startDate}</p>
            <p className="text-xs text-axa-grey-400">to {quote.endDate}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-axa-grey-200" />

      <div className="space-y-3">
        <p className="text-[10px] font-bold tracking-[0.15em] text-axa-grey-400 uppercase">
          {!pastScheduleStep ? 'Select a plan' : 'Payment Summary'}
        </p>

        {pastScheduleStep && (
          <div className="space-y-2 custom-step-enter">
            <div className="flex justify-between items-center">
              <span className="text-xs text-axa-grey-500">{isDeposit ? 'Deposit today' : 'Total due'}</span>
              <span className="text-sm font-bold text-axa-dark">{formatCurrency(amount)}</span>
            </div>
            {isDeposit && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-axa-grey-500">11 monthly payments</span>
                  <span className="text-sm font-bold text-axa-dark">{formatCurrency(quote.remainingBalance / 11)}</span>
                </div>
                {pastMethodStep && (
                  <div className="flex justify-between items-center custom-step-enter">
                    <span className="text-xs text-axa-grey-500">Paid via</span>
                    <span className="text-xs font-semibold text-axa-blue">
                      {pbiMethod === 'sepa' ? 'SEPA Direct Debit' : 'Monthly Card'}
                    </span>
                  </div>
                )}
                <div className="h-px bg-axa-grey-200" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-axa-grey-500">Total cost</span>
                  <span className="text-xs text-axa-grey-500">{formatCurrency(quote.annualPremium)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 space-y-2">
        {[
          { icon: Lock, text: '256-bit TLS encryption' },
          { icon: Shield, text: 'Regulated by CBI' },
          { icon: ShieldCheck, text: 'Powered by Stripe' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[11px] text-axa-grey-400">
            <Icon size={12} />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 1: SCHEDULE SELECTOR
   ═══════════════════════════════════════════════════════ */

function ScheduleStep({
  quote,
  schedule,
  updating,
  onSelect,
}: {
  quote: Quote;
  schedule: PaymentSchedule;
  updating: boolean;
  onSelect: (s: PaymentSchedule) => void;
}) {
  return (
    <div className="custom-step-enter">
      <h2 className="text-2xl font-bold text-axa-dark mb-2">How would you like to pay?</h2>
      <p className="text-sm text-axa-grey-500 mb-8">Choose the payment plan that works best for you.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Pay in Full */}
        <button
          type="button"
          onClick={() => onSelect('annual')}
          disabled={updating}
          className={`group relative text-left rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
            schedule === 'annual' ? 'custom-card-selected' : 'custom-card-idle hover:border-axa-grey-300'
          }`}
        >
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${
            schedule === 'annual' ? 'opacity-100 bg-axa-blue/15' : 'opacity-0 bg-axa-blue/10 group-hover:opacity-50'
          }`} />
          <div className="relative">
            {updating && schedule !== 'annual' ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-axa-grey-300" size={24} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    schedule === 'annual' ? 'bg-axa-blue/10' : 'bg-axa-grey-100'
                  }`}>
                    <CreditCard size={20} className={schedule === 'annual' ? 'text-axa-blue' : 'text-axa-grey-300'} />
                  </div>
                  {schedule === 'annual' && (
                    <div className="w-6 h-6 rounded-full bg-axa-blue flex items-center justify-center custom-step-enter">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <h3 className={`text-lg font-bold mb-1 transition-colors ${schedule === 'annual' ? 'text-axa-dark' : 'text-axa-grey-700'}`}>
                  Pay in Full
                </h3>
                <p className={`text-3xl font-extrabold tracking-tight mb-3 transition-colors ${
                  schedule === 'annual' ? 'text-axa-blue' : 'text-axa-grey-500'
                }`}>{formatCurrency(quote.annualPremium)}</p>
                <p className="text-xs text-axa-grey-400">Single card payment. No monthly commitments.</p>
              </>
            )}
          </div>
        </button>

        {/* PBI */}
        <button
          type="button"
          onClick={() => onSelect('deposit')}
          disabled={updating}
          className={`group relative text-left rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
            schedule === 'deposit' ? 'custom-card-selected' : 'custom-card-idle hover:border-axa-grey-300'
          }`}
        >
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${
            schedule === 'deposit' ? 'opacity-100 bg-axa-blue/15' : 'opacity-0 bg-axa-blue/10 group-hover:opacity-50'
          }`} />
          <div className="relative">
            {updating && schedule !== 'deposit' ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-axa-grey-300" size={24} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    schedule === 'deposit' ? 'bg-axa-blue/10' : 'bg-axa-grey-100'
                  }`}>
                    <CalendarClock size={20} className={schedule === 'deposit' ? 'text-axa-blue' : 'text-axa-grey-300'} />
                  </div>
                  {schedule === 'deposit' && (
                    <div className="w-6 h-6 rounded-full bg-axa-blue flex items-center justify-center custom-step-enter">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <h3 className={`text-lg font-bold mb-1 transition-colors ${schedule === 'deposit' ? 'text-axa-dark' : 'text-axa-grey-700'}`}>
                  Pay by Instalments
                </h3>
                <p className={`text-3xl font-extrabold tracking-tight mb-1 transition-colors ${
                  schedule === 'deposit' ? 'text-axa-blue' : 'text-axa-grey-500'
                }`}>{formatCurrency(quote.depositAmount)}</p>
                <p className="text-xs text-axa-grey-400 mb-2">deposit today</p>
                <div className="flex items-center gap-2 text-xs text-axa-grey-500">
                  <span>then 11 &times; {formatCurrency(quote.remainingBalance / 11)}/mo</span>
                </div>
              </>
            )}
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={() => {/* parent handles via onSelect */}}
        disabled={updating}
        className="mt-8 w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all custom-btn-primary"
      >
        Continue to Payment
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 2 (PBI only): PBI METHOD SELECTOR
   ═══════════════════════════════════════════════════════ */

function PbiMethodStep({
  quote,
  pbiMethod,
  onSelect,
}: {
  quote: Quote;
  pbiMethod: PbiMethod;
  onSelect: (method: PbiMethod) => void;
}) {
  const instalmentAmount = quote.remainingBalance / 11;

  return (
    <div className="custom-step-enter">
      <h2 className="text-2xl font-bold text-axa-dark mb-2">How would you like to pay your instalments?</h2>
      <p className="text-sm text-axa-grey-500 mb-8">
        Your {formatCurrency(quote.depositAmount)} deposit will be paid by card.
        Choose how the remaining 11 monthly payments of{' '}
        <span className="text-axa-grey-700 font-semibold">{formatCurrency(instalmentAmount)}</span>{' '}
        are collected.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* PBI by Card */}
        <button
          type="button"
          onClick={() => onSelect('card')}
          className={`group relative text-left rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
            pbiMethod === 'card' ? 'custom-card-selected' : 'custom-card-idle hover:border-axa-grey-300'
          }`}
        >
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${
            pbiMethod === 'card' ? 'opacity-100 bg-axa-blue/15' : 'opacity-0 bg-axa-blue/10 group-hover:opacity-50'
          }`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                pbiMethod === 'card' ? 'bg-axa-blue/10' : 'bg-axa-grey-100'
              }`}>
                <CreditCard size={20} className={pbiMethod === 'card' ? 'text-axa-blue' : 'text-axa-grey-300'} />
              </div>
              {pbiMethod === 'card' && (
                <div className="w-6 h-6 rounded-full bg-axa-blue flex items-center justify-center custom-step-enter">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            <h3 className={`text-lg font-bold mb-2 transition-colors ${pbiMethod === 'card' ? 'text-axa-dark' : 'text-axa-grey-700'}`}>
              Pay by Card
            </h3>
            <p className="text-xs text-axa-grey-400 leading-relaxed mb-3">
              Your saved card will be charged {formatCurrency(instalmentAmount)} each month automatically.
            </p>

            <div className="flex items-center gap-3 text-xs text-axa-grey-500 pt-3 border-t border-axa-grey-200">
              <div className="flex -space-x-1">
                <div className="w-6 h-4 rounded-sm bg-blue-50 border border-blue-200" />
                <div className="w-6 h-4 rounded-sm bg-red-50 border border-red-200" />
              </div>
              <span>Visa, Mastercard, Amex</span>
            </div>
          </div>
        </button>

        {/* PBI by SEPA DD */}
        <button
          type="button"
          onClick={() => onSelect('sepa')}
          className={`group relative text-left rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
            pbiMethod === 'sepa' ? 'custom-card-selected' : 'custom-card-idle hover:border-axa-grey-300'
          }`}
        >
          <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${
            pbiMethod === 'sepa' ? 'opacity-100 bg-axa-blue/15' : 'opacity-0 bg-axa-blue/10 group-hover:opacity-50'
          }`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                pbiMethod === 'sepa' ? 'bg-axa-blue/10' : 'bg-axa-grey-100'
              }`}>
                <Building2 size={20} className={pbiMethod === 'sepa' ? 'text-axa-blue' : 'text-axa-grey-300'} />
              </div>
              {pbiMethod === 'sepa' && (
                <div className="w-6 h-6 rounded-full bg-axa-blue flex items-center justify-center custom-step-enter">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            <h3 className={`text-lg font-bold mb-2 transition-colors ${pbiMethod === 'sepa' ? 'text-axa-dark' : 'text-axa-grey-700'}`}>
              SEPA Direct Debit
            </h3>
            <p className="text-xs text-axa-grey-400 leading-relaxed mb-3">
              {formatCurrency(instalmentAmount)} debited from your bank account each month via SEPA mandate.
            </p>

            <div className="flex items-center gap-3 text-xs text-axa-grey-500 pt-3 border-t border-axa-grey-200">
              <Building2 size={14} className="text-axa-grey-400" />
              <span>European bank account (IBAN)</span>
            </div>
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelect(pbiMethod)}
        className="mt-8 w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all custom-btn-primary"
      >
        {pbiMethod === 'sepa' ? 'Continue to Direct Debit Setup' : 'Continue to Card Payment'}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SEPA DIRECT DEBIT STEP
   ═══════════════════════════════════════════════════════ */

function CustomSepaForm({
  quote,
  onConfirmReady,
  onContinue,
}: {
  quote: Quote;
  onConfirmReady: (fn: () => Promise<void>) => void;
  onContinue: () => void;
}) {
  const checkoutState = useCheckoutElements();
  const checkout = checkoutState.type === 'success' ? checkoutState.checkout : null;
  const instalmentAmount = quote.remainingBalance / 11;
  const startMonth = getInstalmentStartMonth(quote.startDate);

  const confirm = useCallback(async () => {
    if (!checkout) throw new Error('SEPA payment not ready');
    // SEPA does not redirect — the result comes back in place.
    const result = await checkout.confirm({ redirect: 'if_required' });
    if (result.type === 'error') throw new Error(result.error.message);
  }, [checkout]);

  useEffect(() => {
    if (checkout) onConfirmReady(confirm);
  }, [checkout, confirm, onConfirmReady]);

  return (
    <div className="custom-step-enter">
      <h2 className="text-2xl font-bold text-axa-dark mb-2">Set up your Direct Debit</h2>
      <p className="text-sm text-axa-grey-500 mb-8">
        {formatCurrency(quote.remainingBalance)} split across 11 monthly payments of{' '}
        <span className="text-axa-grey-700 font-semibold">{formatCurrency(instalmentAmount)}</span>{' '}
        starting {startMonth}.
      </p>

      <div className="custom-glass rounded-2xl p-6">
        <PaymentElement options={{ layout: 'tabs' }} />
        <p className="mt-5 text-[11px] text-axa-grey-400 leading-relaxed">
          By providing your IBAN and confirming this payment, you authorise AXA Insurance dac and Stripe, our
          payment service provider, to send instructions to your bank to debit your account in accordance with
          those instructions. You are entitled to a refund from your bank under the terms of your agreement with your bank.
        </p>
      </div>

      {/* Instalment preview */}
      <div className="mt-6 custom-glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} className="text-axa-blue" />
          <span className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase">Payment Schedule Preview</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
          {Array.from({ length: 11 }, (_, i) => {
            const date = new Date(quote.startDate);
            date.setMonth(date.getMonth() + 1 + i);
            const month = date.toLocaleDateString('en-IE', { month: 'short' });
            return (
              <div key={i} className="flex-shrink-0 w-16 bg-axa-grey-50 border border-axa-grey-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-axa-grey-400 uppercase">{month}</p>
                <p className="text-xs font-bold text-axa-grey-600 mt-0.5">{formatCurrency(instalmentAmount)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all custom-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue to Card Payment
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CARD PAYMENT STEP
   ═══════════════════════════════════════════════════════ */

function CustomCardForm({
  amount,
  schedule,
  remainingBalance,
  confirmSepa,
  pbiMethod,
}: {
  amount: number;
  schedule: PaymentSchedule;
  remainingBalance?: number;
  confirmSepa?: (() => Promise<void>) | null;
  pbiMethod: PbiMethod;
}) {
  const checkoutState = useCheckoutElements();
  const checkout = checkoutState.type === 'success' ? checkoutState.checkout : null;
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDeposit = schedule === 'deposit';
  const isSepaPbi = isDeposit && pbiMethod === 'sepa';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!checkout) return;

    setProcessing(true);
    setError(null);

    try {
      if (isSepaPbi && confirmSepa) await confirmSepa();

      // Override the session's return_url so the confirmation page knows the
      // PBI method. The {CHECKOUT_SESSION_ID} placeholder is substituted by
      // Stripe on redirect — keep it literal (no URL-encoding).
      const returnUrl = isDeposit
        ? `${window.location.origin}${ROUTES.CUSTOM_CONFIRMATION}?session_id={CHECKOUT_SESSION_ID}&pbi_method=${pbiMethod}`
        : undefined;

      const result = await checkout.confirm(returnUrl ? { returnUrl } : undefined);

      if (result.type === 'error') {
        setError(result.error.message || 'An unexpected error occurred.');
        setProcessing(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="custom-step-enter">
      <h2 className="text-2xl font-bold text-axa-dark mb-2">
        {isDeposit ? 'Pay your deposit' : 'Enter card details'}
      </h2>
      <p className="text-sm text-axa-grey-500 mb-8">
        {isDeposit
          ? `${formatCurrency(amount)} will be charged to your card today as a deposit.`
          : `Complete your ${formatCurrency(amount)} payment securely with your card.`}
      </p>

      <div className="custom-glass rounded-2xl p-6">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 text-axa-red text-sm bg-red-50 border border-red-200 p-4 rounded-xl">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary strip for PBI */}
      {isDeposit && remainingBalance != null && (
        <div className="mt-6 custom-glass rounded-2xl p-5 space-y-3">
          <p className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase">
            When you confirm, we will:
          </p>

          {isSepaPbi ? (
            <>
              <div className="flex items-center gap-3 text-sm text-axa-grey-600">
                <div className="w-7 h-7 rounded-lg bg-axa-blue/10 text-axa-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold">1</span>
                </div>
                Set up your Direct Debit — 11 &times; {formatCurrency(remainingBalance / 11)}/mo
              </div>
              <div className="flex items-center gap-3 text-sm text-axa-grey-600">
                <div className="w-7 h-7 rounded-lg bg-axa-blue/10 text-axa-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold">2</span>
                </div>
                Charge {formatCurrency(amount)} to your card as a deposit
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm text-axa-grey-600">
                <div className="w-7 h-7 rounded-lg bg-axa-blue/10 text-axa-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold">1</span>
                </div>
                Charge {formatCurrency(amount)} deposit to your card today
              </div>
              <div className="flex items-center gap-3 text-sm text-axa-grey-600">
                <div className="w-7 h-7 rounded-lg bg-axa-blue/10 text-axa-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold">2</span>
                </div>
                Save your card for 11 monthly payments of {formatCurrency(remainingBalance / 11)}
              </div>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] text-axa-grey-300">
        By confirming, you agree to the AXA Motor Insurance policy terms and conditions.
      </p>

      <button
        type="submit"
        disabled={!checkout || processing}
        className="mt-6 w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed custom-btn-primary custom-btn-glow"
      >
        {processing ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Processing securely...
          </>
        ) : isDeposit ? (
          <>
            <ShieldCheck size={18} />
            {isSepaPbi ? 'Confirm Deposit & Direct Debit' : `Pay ${formatCurrency(amount)} Deposit`}
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Pay {formatCurrency(amount)} Securely
          </>
        )}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE ORCHESTRATOR
   ═══════════════════════════════════════════════════════ */

export default function CustomPage() {
  const navigate = useNavigate();
  const { quote, loading: quoteLoading, schedule, setSchedule } = useQuote();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [sepaClientSecret, setSepaClientSecret] = useState<string | null>(null);
  const [confirmSepa, setConfirmSepa] = useState<(() => Promise<void>) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [scheduleUpdating, setScheduleUpdating] = useState(false);

  const [pbiMethod, setPbiMethod] = useState<PbiMethod>('card');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const isDeposit = schedule === 'deposit';
  const steps = getSteps(isDeposit, pbiMethod);
  const currentStep = steps[currentStepIdx];

  useEffect(() => {
    setInitializing(true);

    const promises: Promise<void>[] = [
      createElementsSession(QUOTE_ID, schedule, 'custom').then((data) => {
        setClientSecret(data.clientSecret);
        setSessionId(data.sessionId);
        setAmount(data.amount);
      }),
    ];

    if (schedule === 'deposit') {
      promises.push(
        createSepaSession(QUOTE_ID).then((data) => {
          setSepaClientSecret(data.clientSecret);
        }),
      );
    }

    Promise.all(promises)
      .catch((err) => setError((err as Error).message))
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmReady = useCallback((fn: () => Promise<void>) => {
    setConfirmSepa(() => fn);
  }, []);


  function goToStep(idx: number) {
    setCurrentStepIdx(idx);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleScheduleSelect(newSchedule: PaymentSchedule) {
    if (newSchedule !== schedule && sessionId) {
      setScheduleUpdating(true);
      try {
        const {
          clientSecret: newSecret,
          sessionId: newSessionId,
          amount: newAmount,
        } = await updateElementsSession(sessionId, newSchedule, 'custom');
        let sepaSecret: string | null = null;
        if (newSchedule === 'deposit') {
          const sepaData = await createSepaSession(QUOTE_ID);
          sepaSecret = sepaData.clientSecret;
        }
        setSchedule(newSchedule);
        setClientSecret(newSecret);
        setSessionId(newSessionId);
        setAmount(newAmount);
        if (sepaSecret !== undefined) setSepaClientSecret(sepaSecret);
        if (!sepaSecret) setConfirmSepa(null);
      } catch {
        // revert on error
      } finally {
        setScheduleUpdating(false);
      }
    }

    // Advance: annual goes straight to card, deposit goes to pbi-method
    goToStep(1);
  }

  async function handlePbiMethodSelect(method: PbiMethod) {
    setPbiMethod(method);

    // If switching to SEPA and we don't have a SEPA secret yet, create one
    if (method === 'sepa' && !sepaClientSecret) {
      try {
        const sepaData = await createSepaSession(QUOTE_ID);
        setSepaClientSecret(sepaData.clientSecret);
      } catch {
        // handled in render
      }
    }

    // Clear SEPA confirm callback if switching away from SEPA
    if (method === 'card') {
      setConfirmSepa(null);
    }

    // Advance to next step
    // For sepa: steps are [schedule, pbi-method, sepa, card] → go to idx 2
    // For card: steps are [schedule, pbi-method, card] → go to idx 2
    goToStep(2);
  }

  if (quoteLoading || !quote) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8">
        <div className="min-h-screen bg-axa-grey-100 flex items-center justify-center">
          <div className="custom-spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8">
        <div className="min-h-screen bg-axa-grey-100 flex items-center justify-center">
          <div className="max-w-lg text-center px-4">
            <AlertCircle className="mx-auto text-axa-red" size={48} />
            <h1 className="mt-4 text-xl font-bold text-axa-dark">Unable to initialise payment</h1>
            <p className="mt-2 text-axa-grey-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <IntegrationSpotlightProvider>
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8">
      <div className="min-h-screen bg-axa-grey-100 custom-bg-pattern">
        {/* Top bar */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-axa-grey-200 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => currentStepIdx > 0 ? goToStep(currentStepIdx - 1) : navigate(ROUTES.QUOTE)}
              className="flex items-center gap-1.5 text-xs text-axa-grey-400 hover:text-axa-grey-600 transition-colors"
            >
              <ArrowLeft size={14} />
              {currentStepIdx > 0 ? 'Back' : 'Quote'}
            </button>

            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-axa-blue" />
              <span className="text-xs font-semibold text-axa-blue tracking-wider uppercase">Custom Experience</span>
            </div>

            <span className="text-[10px] text-axa-grey-300 font-medium tracking-wider uppercase">Test Mode</span>
          </div>
        </div>

        {/* Main layout */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            {/* Content area */}
            <div ref={contentRef}>
              <div className="mb-10">
                <WizardProgress steps={steps} currentIdx={currentStepIdx} />
              </div>

              {initializing || !clientSecret ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="custom-spinner" />
                  <span className="text-sm text-axa-grey-400">Preparing your checkout...</span>
                </div>
              ) : currentStep === 'schedule' ? (
                <IntegrationAnchor specId="payment-intent" position="top-right">
                  <ScheduleStep
                    quote={quote}
                    schedule={schedule}
                    updating={scheduleUpdating}
                    onSelect={handleScheduleSelect}
                  />
                </IntegrationAnchor>
              ) : currentStep === 'pbi-method' ? (
                <PbiMethodStep
                  quote={quote}
                  pbiMethod={pbiMethod}
                  onSelect={handlePbiMethodSelect}
                />
              ) : currentStep === 'sepa' && sepaClientSecret ? (
                <CheckoutElementsProvider
                  stripe={stripePromise}
                  options={{
                    clientSecret: sepaClientSecret,
                    elementsOptions: { appearance: customAppearance },
                    // Prefill the mandate contact details on the session.
                    defaultValues: {
                      email: quote.customerEmail,
                      billingAddress: {
                        name: quote.customerName,
                        address: {
                          line1: quote.addressLine1,
                          city: quote.addressCity,
                          postal_code: quote.addressPostcode,
                          country: quote.addressCountry,
                        },
                      },
                    },
                  }}
                  key={sepaClientSecret}
                >
                  <CustomSepaForm
                    quote={quote}
                    onConfirmReady={handleConfirmReady}
                    onContinue={() => goToStep(currentStepIdx + 1)}
                  />
                </CheckoutElementsProvider>
              ) : currentStep === 'card' ? (
                <IntegrationAnchor specId="customer-session" position="top-right">
                  <IntegrationAnchor specId="list-saved-pms" position="top-left">
                    <IntegrationAnchor specId="set-default-card" position="bottom-right">
                      <IntegrationAnchor specId="webhook-payment-success" position="bottom-left">
                        <CheckoutElementsProvider
                          stripe={stripePromise}
                          options={{
                            clientSecret,
                            elementsOptions: {
                              appearance: customAppearance,
                              savedPaymentMethod: { enableSave: 'auto', enableRedisplay: 'auto' },
                            },
                          }}
                          key={clientSecret}
                        >
                          <CustomCardForm
                            amount={amount}
                            schedule={schedule}
                            remainingBalance={quote.remainingBalance}
                            confirmSepa={confirmSepa}
                            pbiMethod={pbiMethod}
                          />
                        </CheckoutElementsProvider>
                      </IntegrationAnchor>
                    </IntegrationAnchor>
                  </IntegrationAnchor>
                </IntegrationAnchor>
              ) : null}

              <div className="mt-10">
                <TestCardsPanel />
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <IntegrationAnchor specId="sync-customer" position="top-right">
                <LiveSummary
                  quote={quote}
                  schedule={schedule}
                  amount={amount}
                  currentStep={currentStep}
                  pbiMethod={pbiMethod}
                />
              </IntegrationAnchor>
            </div>
          </div>
        </div>
      </div>
    </div>
    </IntegrationSpotlightProvider>
  );
}
