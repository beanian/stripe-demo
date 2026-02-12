import { useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Building2 } from 'lucide-react';
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/constants';
import { axaAppearance } from '../../lib/stripe-appearance';
import type { Quote } from '../../types/quote';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface DirectDebitInfoProps {
  quote: Quote;
  sepaClientSecret: string;
  onConfirmReady: (confirmFn: () => Promise<void>) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function getInstalmentStartMonth(startDate: string): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
}

function SepaForm({ quote, onConfirmReady }: { quote: Quote; onConfirmReady: (fn: () => Promise<void>) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const instalmentAmount = quote.remainingBalance / 11;
  const startMonth = getInstalmentStartMonth(quote.startDate);

  const confirm = useCallback(async () => {
    if (!stripe || !elements) throw new Error('SEPA payment not ready');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) throw error;
  }, [stripe, elements]);

  useEffect(() => {
    if (stripe && elements) {
      onConfirmReady(confirm);
    }
  }, [stripe, elements, confirm, onConfirmReady]);

  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      {/* Step header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-axa-blue/10 text-axa-blue flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div className="pt-1.5">
          <h3 className="font-semibold text-axa-dark flex items-center gap-2">
            <Building2 size={16} className="text-axa-blue" />
            Set Up Direct Debit
          </h3>
          <p className="text-sm text-axa-grey-700 mt-0.5">
            {formatCurrency(quote.remainingBalance)} in 11 monthly instalments of{' '}
            <span className="font-semibold text-axa-dark">{formatCurrency(instalmentAmount)}</span>{' '}
            starting {startMonth}
          </p>
        </div>
      </div>

      {/* SEPA form card */}
      <div className="ml-5 pl-9 border-l-2 border-axa-grey-200">
        <div className="card-elevated p-5">
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  name: quote.customerName,
                  email: quote.customerEmail,
                  address: {
                    line1: quote.addressLine1,
                    city: quote.addressCity,
                    postal_code: quote.addressPostcode,
                    country: quote.addressCountry,
                  },
                },
              },
            }}
          />

          <p className="mt-4 text-xs text-axa-grey-500 leading-relaxed">
            By providing your IBAN and confirming this payment, you authorise AXA Insurance dac and Stripe, our
            payment service provider, to send instructions to your bank to debit your account in accordance with
            those instructions. You are entitled to a refund from your bank under the terms and conditions of your
            agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your
            account was debited.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DirectDebitInfo({ quote, sepaClientSecret, onConfirmReady }: DirectDebitInfoProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: sepaClientSecret, appearance: axaAppearance }}
      key={sepaClientSecret}
    >
      <SepaForm quote={quote} onConfirmReady={onConfirmReady} />
    </Elements>
  );
}
