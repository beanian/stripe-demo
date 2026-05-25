import { useEffect, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle } from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';
import { createPaymentIntent, createSepaIntent } from '../lib/api';
import { STRIPE_PUBLISHABLE_KEY, QUOTE_ID } from '../lib/constants';
import { axaAppearance } from '../lib/stripe-appearance';
import StepIndicator from '../components/shared/StepIndicator';
import PathBadge from '../components/shared/PathBadge';
import QuoteSummaryCard from '../components/shared/QuoteSummaryCard';
import TestCardsPanel from '../components/shared/TestCardsPanel';
import ScheduleSelector from '../components/elements/ScheduleSelector';
import PaymentForm from '../components/elements/PaymentForm';
import DirectDebitInfo from '../components/elements/DirectDebitInfo';
import TrustSignals from '../components/elements/TrustSignals';
import ContextualHelp from '../components/elements/ContextualHelp';
import {
  IntegrationSpotlightProvider,
  IntegrationAnchor,
} from '../components/integration/IntegrationSpotlight';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function ElementsPage() {
  const { quote, loading: quoteLoading, schedule } = useQuote();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [customerSessionSecret, setCustomerSessionSecret] = useState<string | null>(null);
  const [sepaClientSecret, setSepaClientSecret] = useState<string | null>(null);
  const [confirmSepa, setConfirmSepa] = useState<(() => Promise<void>) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const isDeposit = schedule === 'deposit';

  useEffect(() => {
    setInitializing(true);

    const promises: Promise<void>[] = [
      createPaymentIntent(QUOTE_ID, schedule).then((data) => {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setAmount(data.amount);
        setCustomerSessionSecret(data.customerSessionClientSecret ?? null);
      }),
    ];

    if (schedule === 'deposit') {
      promises.push(
        createSepaIntent(QUOTE_ID).then((data) => {
          setSepaClientSecret(data.clientSecret);
        }),
      );
    }

    Promise.all(promises)
      .catch((err) => setError((err as Error).message))
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScheduleUpdate(
    newClientSecret: string,
    newAmount: number,
    newSepaSecret?: string | null,
    newCustomerSessionSecret?: string | null,
  ) {
    setClientSecret(newClientSecret);
    setAmount(newAmount);
    if (newSepaSecret !== undefined) {
      setSepaClientSecret(newSepaSecret);
    }
    if (!newSepaSecret) {
      setConfirmSepa(null);
    }
    if (newCustomerSessionSecret !== undefined) {
      setCustomerSessionSecret(newCustomerSessionSecret);
    }
  }

  const handleConfirmReady = useCallback((fn: () => Promise<void>) => {
    setConfirmSepa(() => fn);
  }, []);

  if (quoteLoading || !quote) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-axa-blue" size={32} />
        <span className="ml-3 text-axa-grey-700">Loading quote...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-axa-red" size={48} />
        <h1 className="mt-4 text-xl font-bold text-axa-dark">Unable to initialise payment</h1>
        <p className="mt-2 text-axa-grey-700">{error}</p>
      </div>
    );
  }

  return (
    <IntegrationSpotlightProvider>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <StepIndicator currentStep={2} />

      <div className="mb-6">
        <PathBadge path="B" />
        <h1 className="mt-3 text-2xl font-bold text-axa-dark tracking-tight">Complete Your Payment</h1>
        <p className="mt-1 text-axa-grey-700">
          Secure payment with full AXA branding — notice the customised form below
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main payment column */}
        <div className="lg:col-span-2 space-y-6">
          {paymentIntentId && (
            <IntegrationAnchor specId="payment-intent">
              <ScheduleSelector
                paymentIntentId={paymentIntentId}
                onUpdate={handleScheduleUpdate}
              />
            </IntegrationAnchor>
          )}

          {initializing || !clientSecret ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-axa-blue" size={32} />
              <span className="ml-3 text-axa-grey-700">Preparing payment form...</span>
            </div>
          ) : isDeposit ? (
            /* PBI flow — Step 1: SEPA, then Step 2: Card + Button */
            <div className="space-y-6">
              {sepaClientSecret && (
                <DirectDebitInfo
                  quote={quote}
                  sepaClientSecret={sepaClientSecret}
                  onConfirmReady={handleConfirmReady}
                />
              )}

              <IntegrationAnchor specId="customer-session" position="top-right">
                <IntegrationAnchor specId="list-saved-pms" position="top-left">
                  <IntegrationAnchor specId="webhook-pm-attached" position="bottom-right">
                    <IntegrationAnchor specId="webhook-payment-success" position="bottom-left">
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: axaAppearance,
                          ...(customerSessionSecret
                            ? { customerSessionClientSecret: customerSessionSecret }
                            : {}),
                        }}
                        key={clientSecret}
                      >
                        <PaymentForm
                          amount={amount}
                          schedule={schedule}
                          remainingBalance={quote.remainingBalance}
                          confirmSepa={confirmSepa}
                          startDate={quote.startDate}
                        />
                      </Elements>
                    </IntegrationAnchor>
                  </IntegrationAnchor>
                </IntegrationAnchor>
              </IntegrationAnchor>
            </div>
          ) : (
            /* Pay in Full — just the card form */
            <IntegrationAnchor specId="customer-session" position="top-right">
              <IntegrationAnchor specId="list-saved-pms" position="top-left">
                <IntegrationAnchor specId="webhook-pm-attached" position="bottom-right">
                  <IntegrationAnchor specId="webhook-payment-success" position="bottom-left">
                    <div className="card-elevated p-6 animate-fade-in">
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: axaAppearance,
                          ...(customerSessionSecret
                            ? { customerSessionClientSecret: customerSessionSecret }
                            : {}),
                        }}
                        key={clientSecret}
                      >
                        <PaymentForm amount={amount} schedule={schedule} />
                      </Elements>
                    </div>
                  </IntegrationAnchor>
                </IntegrationAnchor>
              </IntegrationAnchor>
            </IntegrationAnchor>
          )}

          <TrustSignals />
          <ContextualHelp />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <IntegrationAnchor specId="sync-customer" position="top-right">
            <QuoteSummaryCard quote={quote} schedule={schedule} compact />
          </IntegrationAnchor>
          <TestCardsPanel />
        </div>
      </div>
    </div>
    </IntegrationSpotlightProvider>
  );
}
