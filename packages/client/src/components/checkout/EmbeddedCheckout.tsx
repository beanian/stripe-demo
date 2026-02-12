import { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import type { PaymentSchedule } from '../../types/quote';
import { createCheckoutSession } from '../../lib/api';
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/constants';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface EmbeddedCheckoutWrapperProps {
  quoteId: string;
  paymentSchedule: PaymentSchedule;
}

export default function EmbeddedCheckoutWrapper({ quoteId, paymentSchedule }: EmbeddedCheckoutWrapperProps) {
  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await createCheckoutSession(quoteId, paymentSchedule);
    return clientSecret;
  }, [quoteId, paymentSchedule]);

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-axa-blue" size={32} />
        <span className="ml-3 text-axa-grey-700">Loading payment...</span>
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
