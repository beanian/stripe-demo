import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
  Elements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import PathBadge from '../shared/PathBadge';
import { axaAppearance } from '../../lib/stripe-appearance';
import { STRIPE_PUBLISHABLE_KEY, QUOTE_ID } from '../../lib/constants';
import { createCheckoutSession, createPaymentIntent } from '../../lib/api';
import { useQuote } from '../../contexts/QuoteContext';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface PathPanelProps {
  path: 'A' | 'B';
}

function PathAContent() {
  const { schedule } = useQuote();

  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await createCheckoutSession(QUOTE_ID, schedule);
    return clientSecret;
  }, [schedule]);

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}

function PathBForm() {
  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="button"
        className="w-full py-3 bg-axa-blue text-white font-semibold rounded-axa hover:bg-axa-blue/90 transition-colors"
      >
        Pay
      </button>
    </div>
  );
}

function PathBContent() {
  const { schedule } = useQuote();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createPaymentIntent(QUOTE_ID, schedule)
      .then(({ clientSecret: cs }) => setClientSecret(cs))
      .catch((err) => setError((err as Error).message));
  }, [schedule]);

  if (error) {
    return <p className="text-sm text-axa-red">{error}</p>;
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-axa-blue" size={24} />
        <span className="ml-2 text-sm text-axa-grey-700">Creating payment intent...</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: axaAppearance }}>
      <PathBForm />
    </Elements>
  );
}

export default function PathPanel({ path }: PathPanelProps) {
  return (
    <div className="space-y-4">
      <PathBadge path={path} />
      {path === 'A' ? <PathAContent /> : <PathBContent />}
    </div>
  );
}
