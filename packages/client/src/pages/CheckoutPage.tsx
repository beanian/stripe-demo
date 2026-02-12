import { Loader2 } from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';
import { QUOTE_ID } from '../lib/constants';
import StepIndicator from '../components/shared/StepIndicator';
import PathBadge from '../components/shared/PathBadge';
import QuoteSummaryCard from '../components/shared/QuoteSummaryCard';
import TestCardsPanel from '../components/shared/TestCardsPanel';
import EmbeddedCheckoutWrapper from '../components/checkout/EmbeddedCheckout';

export default function CheckoutPage() {
  const { quote, loading, schedule } = useQuote();

  if (loading || !quote) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-axa-blue" size={32} />
        <span className="ml-3 text-axa-grey-700">Loading quote...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StepIndicator currentStep={2} />

      <div className="mb-6">
        <PathBadge path="A" />
        <h1 className="mt-3 text-2xl font-bold text-axa-dark">Complete Payment</h1>
        <p className="mt-1 text-axa-grey-700">
          Stripe Embedded Checkout — you're now inside Stripe's iframe with limited customisation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EmbeddedCheckoutWrapper quoteId={QUOTE_ID} paymentSchedule={schedule} />
        </div>

        <div className="space-y-4">
          <QuoteSummaryCard quote={quote} schedule={schedule} compact />
          <TestCardsPanel />
        </div>
      </div>
    </div>
  );
}
