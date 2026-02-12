import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, CreditCard, Building2, CalendarDays } from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';
import { ROUTES } from '../lib/constants';
import StepIndicator from '../components/shared/StepIndicator';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function ElementsConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { quote, schedule } = useQuote();

  const redirectStatus = searchParams.get('redirect_status');
  const succeeded = redirectStatus === 'succeeded';
  const isDeposit = schedule === 'deposit';

  if (!succeeded) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <StepIndicator currentStep={3} />
        <AlertCircle className="mx-auto text-axa-red" size={64} />
        <h1 className="mt-4 text-2xl font-bold text-axa-dark">Payment Not Completed</h1>
        <p className="mt-2 text-axa-grey-700">
          Status: {redirectStatus || 'unknown'}. Please try again or contact support.
        </p>
        <button
          onClick={() => navigate(ROUTES.ELEMENTS)}
          className="mt-6 px-6 py-2.5 bg-axa-blue text-white rounded-axa font-semibold hover:bg-axa-blue/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <StepIndicator currentStep={3} />

      {/* Success hero */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-axa-green animate-scale-in">
          <CheckCircle2 className="text-white" size={48} />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-axa-dark tracking-tight">
          {isDeposit ? 'Deposit & Direct Debit Confirmed' : 'Payment Successful'}
        </h1>
        <p className="mt-2 text-axa-grey-700 max-w-md mx-auto">
          {isDeposit
            ? 'Your deposit has been charged and your Direct Debit mandate is now active.'
            : 'Your motor insurance payment has been processed and confirmed.'}
        </p>
      </div>

      {/* Payment breakdown for PBI */}
      {isDeposit && quote && (
        <div className="mt-8 card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-lg font-semibold text-axa-dark mb-5">Payment Breakdown</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Deposit card */}
            <div className="bg-axa-green/[0.06] border border-axa-green/20 rounded-axa p-4">
              <div className="flex items-center gap-2 text-axa-green text-xs font-semibold uppercase tracking-wide mb-2">
                <CreditCard size={14} />
                Paid Today
              </div>
              <p className="text-2xl font-bold text-axa-dark">{formatCurrency(quote.depositAmount)}</p>
              <p className="text-xs text-axa-grey-700 mt-0.5">Card deposit</p>
            </div>

            {/* DD card */}
            <div className="bg-axa-blue/[0.04] border border-axa-blue/10 rounded-axa p-4">
              <div className="flex items-center gap-2 text-axa-blue text-xs font-semibold uppercase tracking-wide mb-2">
                <Building2 size={14} />
                Direct Debit
              </div>
              <p className="text-2xl font-bold text-axa-dark">{formatCurrency(quote.remainingBalance)}</p>
              <p className="text-xs text-axa-grey-700 mt-0.5">11 monthly instalments</p>
            </div>
          </div>

          {/* Instalment schedule */}
          <div className="mt-5 pt-5 border-t border-axa-grey-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} className="text-axa-blue" />
              <h3 className="text-sm font-semibold text-axa-dark">Upcoming Direct Debit Schedule</h3>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-axa border border-axa-grey-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-axa-grey-50">
                  <tr className="text-left text-axa-grey-500">
                    <th className="py-2 px-3 font-medium text-xs">#</th>
                    <th className="py-2 px-3 font-medium text-xs">Date</th>
                    <th className="py-2 px-3 font-medium text-xs text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 11 }, (_, i) => {
                    const date = new Date(quote.startDate);
                    date.setMonth(date.getMonth() + 1 + i);
                    const monthLabel = date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
                    const instalmentAmount = quote.remainingBalance / 11;
                    return (
                      <tr key={i} className="border-t border-axa-grey-100">
                        <td className="py-2 px-3 text-axa-grey-500 text-xs">{i + 1}</td>
                        <td className="py-2 px-3 text-axa-dark">{monthLabel}</td>
                        <td className="py-2 px-3 text-axa-dark font-medium text-right">{formatCurrency(instalmentAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Policy details */}
      {quote && (
        <div className="mt-6 card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-lg font-semibold text-axa-dark mb-4">Policy Details</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-axa-grey-500 text-xs">Policyholder</span>
              <p className="font-medium text-axa-dark">{quote.customerName}</p>
            </div>
            <div>
              <span className="text-axa-grey-500 text-xs">Vehicle</span>
              <p className="font-medium text-axa-dark">
                {quote.vehicleMake} {quote.vehicleModel} ({quote.vehicleYear})
              </p>
            </div>
            <div>
              <span className="text-axa-grey-500 text-xs">Registration</span>
              <p className="font-medium text-axa-dark">{quote.vehicleReg}</p>
            </div>
            <div>
              <span className="text-axa-grey-500 text-xs">Cover Period</span>
              <p className="font-medium text-axa-dark">{quote.startDate} — {quote.endDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* What's Next */}
      <div className="mt-6 card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <h2 className="text-lg font-semibold text-axa-dark mb-4">What Happens Next</h2>
        <ol className="space-y-3">
          {[
            'You\'ll receive your policy documents via email',
            `Your motor insurance cover begins on ${quote?.startDate ?? 'your start date'}`,
            'Download your insurance disc from your AXA account',
          ].map((text, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-axa-blue text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-axa-grey-700">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action button */}
      <div className="mt-8 flex justify-center animate-slide-up" style={{ animationDelay: '0.45s' }}>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="px-6 py-3 bg-axa-blue text-white rounded-axa font-semibold hover:bg-axa-blue/90 transition-colors"
        >
          Start New Demo
        </button>
      </div>
    </div>
  );
}
