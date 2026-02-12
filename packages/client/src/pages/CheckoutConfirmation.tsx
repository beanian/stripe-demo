import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getSessionStatus } from '../lib/api';
import { ROUTES } from '../lib/constants';
import StepIndicator from '../components/shared/StepIndicator';
import type { SessionStatusResponse } from '../types/stripe';

export default function CheckoutConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SessionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found.');
      setLoading(false);
      return;
    }

    getSessionStatus(sessionId)
      .then((data) => setStatus(data))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-axa-blue" size={32} />
        <span className="ml-3 text-axa-grey-700">Checking payment status...</span>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto text-axa-red" size={48} />
        <h1 className="mt-4 text-xl font-bold text-axa-dark">Something went wrong</h1>
        <p className="mt-2 text-axa-grey-700">{error || 'Unable to retrieve session.'}</p>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-6 px-6 py-2 bg-axa-blue text-white rounded-axa font-medium hover:bg-axa-blue/90 transition-colors"
        >
          Return to Start
        </button>
      </div>
    );
  }

  const isPaid = status.payment_status === 'paid';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <StepIndicator currentStep={3} />

      <div className="text-center">
        {isPaid ? (
          <CheckCircle2 className="mx-auto text-axa-green" size={64} />
        ) : (
          <AlertCircle className="mx-auto text-axa-red" size={64} />
        )}

        <h1 className="mt-4 text-2xl font-bold text-axa-dark">
          {isPaid ? 'Payment Successful!' : 'Payment Incomplete'}
        </h1>

        <p className="mt-2 text-axa-grey-700">
          {isPaid
            ? 'Your motor insurance payment has been processed.'
            : `Payment status: ${status.payment_status}`}
        </p>

        {status.customer_email && (
          <p className="mt-2 text-sm text-axa-grey-700">
            Confirmation sent to <span className="font-medium text-axa-dark">{status.customer_email}</span>
          </p>
        )}

        <div className="mt-8">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="px-6 py-2 bg-axa-blue text-white rounded-axa font-medium hover:bg-axa-blue/90 transition-colors"
          >
            Return to Start
          </button>
        </div>
      </div>
    </div>
  );
}
