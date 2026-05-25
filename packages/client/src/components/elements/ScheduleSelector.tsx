import { useState } from 'react';
import { Loader2, CreditCard, CalendarClock } from 'lucide-react';
import { useQuote } from '../../contexts/QuoteContext';
import { updatePaymentIntent, createSepaIntent } from '../../lib/api';
import { QUOTE_ID } from '../../lib/constants';
import type { PaymentSchedule } from '../../types/quote';

interface ScheduleSelectorProps {
  paymentIntentId: string;
  onUpdate: (
    clientSecret: string,
    amount: number,
    sepaClientSecret?: string | null,
    customerSessionClientSecret?: string | null,
  ) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function ScheduleSelector({ paymentIntentId, onUpdate }: ScheduleSelectorProps) {
  const { quote, schedule, setSchedule } = useQuote();
  const [updating, setUpdating] = useState(false);

  async function handleToggle(newSchedule: PaymentSchedule) {
    if (newSchedule === schedule || updating) return;

    setUpdating(true);

    try {
      const { clientSecret, amount, customerSessionClientSecret } = await updatePaymentIntent(
        paymentIntentId,
        newSchedule,
      );

      let sepaSecret: string | null = null;
      if (newSchedule === 'deposit') {
        const sepaData = await createSepaIntent(QUOTE_ID);
        sepaSecret = sepaData.clientSecret;
      }

      setSchedule(newSchedule);
      onUpdate(clientSecret, amount, sepaSecret, customerSessionClientSecret ?? null);
    } catch {
      // revert on error — schedule wasn't changed
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-axa-dark mb-3 tracking-wide uppercase">
        How would you like to pay?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Pay in Full */}
        <button
          type="button"
          onClick={() => handleToggle('annual')}
          disabled={updating}
          className={`relative text-left p-4 rounded-axa border-2 transition-all ${
            schedule === 'annual'
              ? 'border-axa-blue bg-axa-blue/[0.03] shadow-axa-md'
              : 'border-axa-grey-200 bg-white hover:border-axa-grey-300'
          }`}
        >
          {updating && schedule !== 'annual' ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="animate-spin text-axa-grey-500" size={20} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-1.5">
                <CreditCard size={18} className={schedule === 'annual' ? 'text-axa-blue' : 'text-axa-grey-500'} />
                <span className={`font-semibold text-sm ${schedule === 'annual' ? 'text-axa-blue' : 'text-axa-dark'}`}>
                  Pay in Full
                </span>
              </div>
              <p className="text-xs text-axa-grey-700 leading-relaxed">
                Single card payment of {quote ? formatCurrency(quote.annualPremium) : '—'}
              </p>
            </>
          )}
          {schedule === 'annual' && (
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-axa-blue" />
          )}
        </button>

        {/* PBI */}
        <button
          type="button"
          onClick={() => handleToggle('deposit')}
          disabled={updating}
          className={`relative text-left p-4 rounded-axa border-2 transition-all ${
            schedule === 'deposit'
              ? 'border-axa-blue bg-axa-blue/[0.03] shadow-axa-md'
              : 'border-axa-grey-200 bg-white hover:border-axa-grey-300'
          }`}
        >
          {updating && schedule !== 'deposit' ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="animate-spin text-axa-grey-500" size={20} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-1.5">
                <CalendarClock size={18} className={schedule === 'deposit' ? 'text-axa-blue' : 'text-axa-grey-500'} />
                <span className={`font-semibold text-sm ${schedule === 'deposit' ? 'text-axa-blue' : 'text-axa-dark'}`}>
                  PBI
                </span>
              </div>
              <p className="text-xs text-axa-grey-700 leading-relaxed">
                {quote
                  ? `${formatCurrency(quote.depositAmount)} deposit + ${formatCurrency(quote.remainingBalance)} by Direct Debit`
                  : '—'}
              </p>
            </>
          )}
          {schedule === 'deposit' && (
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-axa-blue" />
          )}
        </button>
      </div>
    </div>
  );
}
