import type { Quote, PaymentSchedule } from '../../types/quote';

interface QuoteSummaryCardProps {
  quote: Quote;
  schedule: PaymentSchedule;
  compact?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatCoverType(type: Quote['coverType']): string {
  switch (type) {
    case 'comprehensive':
      return 'Comprehensive';
    case 'third-party':
      return 'Third Party';
    case 'third-party-fire-theft':
      return 'Third Party, Fire & Theft';
  }
}

export default function QuoteSummaryCard({ quote, schedule, compact = false }: QuoteSummaryCardProps) {
  const isDeposit = schedule === 'deposit';

  if (compact) {
    return (
      <div className="card-elevated p-4">
        <p className="font-semibold text-axa-dark">{quote.customerName}</p>
        <p className="text-sm text-axa-grey-700">
          {quote.vehicleMake} {quote.vehicleModel} &middot; {quote.vehicleReg}
        </p>
        <div className="mt-3 pt-3 border-t border-axa-grey-200">
          <p className="text-xs text-axa-grey-500 uppercase tracking-wide font-medium">
            {isDeposit ? 'Total Premium' : 'Amount Due'}
          </p>
          <p className="text-xl font-bold text-axa-blue mt-0.5">
            {formatCurrency(quote.annualPremium)}
          </p>
          {isDeposit && (
            <div className="mt-2 space-y-1 text-xs text-axa-grey-700">
              <div className="flex justify-between">
                <span>Deposit (card)</span>
                <span className="font-medium text-axa-dark">{formatCurrency(quote.depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Debit</span>
                <span className="font-medium text-axa-dark">{formatCurrency(quote.remainingBalance)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-axa-dark mb-4">Quote Summary</h3>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <span className="text-axa-grey-500 text-xs">Customer</span>
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
          <span className="text-axa-grey-500 text-xs">Cover Type</span>
          <p className="font-medium text-axa-dark">{formatCoverType(quote.coverType)}</p>
        </div>
        <div>
          <span className="text-axa-grey-500 text-xs">Full Premium</span>
          <p className="font-medium text-axa-dark">{formatCurrency(quote.annualPremium)}</p>
        </div>
        <div>
          <span className="text-axa-grey-500 text-xs">Start Date</span>
          <p className="font-medium text-axa-dark">{quote.startDate}</p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-axa-grey-200 flex items-center justify-between">
        <span className="text-axa-grey-500 text-sm">
          {isDeposit ? 'Deposit Due Today' : 'Full Premium'}
        </span>
        <span className="text-2xl font-bold text-axa-blue">
          {isDeposit ? formatCurrency(quote.depositAmount) : formatCurrency(quote.annualPremium)}
        </span>
      </div>
    </div>
  );
}
