import { useState, type FormEvent } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../lib/constants';
import type { PaymentSchedule } from '../../types/quote';

interface PaymentFormProps {
  amount: number;
  schedule: PaymentSchedule;
  remainingBalance?: number;
  confirmSepa?: (() => Promise<void>) | null;
  startDate?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function PaymentForm({ amount, schedule, remainingBalance, confirmSepa, startDate }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDeposit = schedule === 'deposit';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      if (isDeposit && confirmSepa) {
        await confirmSepa();
      }

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${ROUTES.ELEMENTS_CONFIRMATION}`,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'An unexpected error occurred.');
        setProcessing(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Step header for PBI */}
      {isDeposit && (
        <div className="flex items-start gap-4 mb-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-axa-blue/10 text-axa-blue flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div className="pt-1.5">
            <h3 className="font-semibold text-axa-dark flex items-center gap-2">
              <CreditCard size={16} className="text-axa-blue" />
              Pay Deposit by Card
            </h3>
            <p className="text-sm text-axa-grey-700 mt-0.5">
              {formatCurrency(amount)} charged to your card today
            </p>
          </div>
        </div>
      )}

      {/* Card form */}
      <div className={isDeposit ? 'ml-5 pl-9 border-l-2 border-transparent' : ''}>
        <div className={isDeposit ? 'card-elevated p-5' : ''}>
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 text-axa-red text-sm bg-red-50 p-3 rounded-axa">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary strip for PBI */}
        {isDeposit && remainingBalance != null && (
          <div className="mt-5 bg-axa-blue/[0.04] border border-axa-blue/10 rounded-axa p-4 space-y-2">
            <p className="text-xs font-semibold text-axa-grey-700 uppercase tracking-wide">
              When you confirm below, we will:
            </p>
            <div className="flex items-center gap-2 text-sm text-axa-dark">
              <div className="w-5 h-5 rounded-full bg-axa-blue/10 text-axa-blue flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold">1</span>
              </div>
              Set up your Direct Debit — 11 monthly payments of {formatCurrency(remainingBalance / 11)}
            </div>
            <div className="flex items-center gap-2 text-sm text-axa-dark">
              <div className="w-5 h-5 rounded-full bg-axa-blue/10 text-axa-blue flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold">2</span>
              </div>
              Charge {formatCurrency(amount)} to your card as a deposit
            </div>
          </div>
        )}

        {/* Terms */}
        <p className="mt-4 text-xs text-axa-grey-500">
          By confirming, you agree to the AXA Motor Insurance policy terms and conditions.
        </p>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="mt-4 w-full py-3.5 bg-axa-blue text-white rounded-axa font-semibold text-[15px] hover:bg-axa-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-axa-md hover:shadow-axa-lg"
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : isDeposit ? (
            <>
              <ShieldCheck size={18} />
              Confirm Deposit & Set Up Direct Debit
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              Pay {formatCurrency(amount)}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
