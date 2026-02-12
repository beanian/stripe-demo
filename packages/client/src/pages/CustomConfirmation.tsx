import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  CalendarDays,
  ArrowRight,
  Shield,
  Mail,
  FileText,
  Download,
  Sparkles,
} from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';
import { ROUTES } from '../lib/constants';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export default function CustomConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { quote, schedule } = useQuote();

  const redirectStatus = searchParams.get('redirect_status');
  const pbiMethod = searchParams.get('pbi_method') as 'card' | 'sepa' | null;
  const succeeded = redirectStatus === 'succeeded';
  const isDeposit = schedule === 'deposit';
  const isSepaPbi = isDeposit && pbiMethod === 'sepa';
  const isCardPbi = isDeposit && pbiMethod === 'card';

  if (!succeeded) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8">
        <div className="min-h-screen bg-axa-grey-100 custom-bg-pattern flex items-center justify-center">
          <div className="max-w-md text-center px-4">
            <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
              <AlertCircle className="text-axa-red" size={40} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-axa-dark">Payment Not Completed</h1>
            <p className="mt-2 text-axa-grey-500 text-sm">
              Status: {redirectStatus || 'unknown'}. Please try again or contact support.
            </p>
            <button
              onClick={() => navigate(ROUTES.CUSTOM)}
              className="mt-8 px-8 py-3.5 custom-btn-primary rounded-xl font-bold text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const successTitle = isDeposit
    ? isSepaPbi
      ? "You're all set!"
      : 'Deposit confirmed!'
    : 'Payment confirmed!';

  const successDescription = isDeposit
    ? isSepaPbi
      ? 'Your deposit has been charged and your Direct Debit mandate is now active.'
      : 'Your deposit has been charged and your card has been saved for monthly payments.'
    : 'Your motor insurance premium has been paid in full.';

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8">
      <div className="min-h-screen bg-axa-grey-100 custom-bg-pattern">
        <div className="max-w-2xl mx-auto px-6 py-16">

          {/* ─── Success Hero ─── */}
          <div className="text-center">
            <div className="relative inline-block custom-step-enter">
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-axa-green/20 custom-pulse-ring" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-axa-green to-emerald-600 flex items-center justify-center shadow-2xl shadow-axa-green/30">
                <CheckCircle2 className="text-white" size={48} />
              </div>
            </div>

            <h1 className="mt-8 text-3xl font-extrabold text-axa-dark tracking-tight animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {successTitle}
            </h1>
            <p className="mt-3 text-axa-grey-500 max-w-sm mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {successDescription}
            </p>
          </div>

          {/* ─── Amount hero card ─── */}
          <div
            className="mt-10 custom-glass rounded-2xl p-8 text-center animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            {isDeposit && quote ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Deposit */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-axa-green/10 border border-axa-green/20 flex items-center justify-center mx-auto mb-3">
                    <CreditCard size={20} className="text-axa-green" />
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase mb-1">Paid Today</p>
                  <p className="text-3xl font-extrabold text-axa-dark">{formatCurrency(quote.depositAmount)}</p>
                  <p className="text-xs text-axa-grey-400 mt-1">Card deposit</p>
                </div>

                {/* Recurring method */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-axa-blue/10 border border-axa-blue/20 flex items-center justify-center mx-auto mb-3">
                    {isSepaPbi
                      ? <Building2 size={20} className="text-axa-blue" />
                      : <CreditCard size={20} className="text-axa-blue" />
                    }
                  </div>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase mb-1">
                    {isSepaPbi ? 'Direct Debit' : 'Monthly Card'}
                  </p>
                  <p className="text-3xl font-extrabold text-axa-dark">{formatCurrency(quote.remainingBalance)}</p>
                  <p className="text-xs text-axa-grey-400 mt-1">11 monthly instalments</p>
                </div>
              </div>
            ) : quote ? (
              <div>
                <div className="w-14 h-14 rounded-2xl bg-axa-green/10 border border-axa-green/20 flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={24} className="text-axa-green" />
                </div>
                <p className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase mb-2">Amount Paid</p>
                <p className="text-5xl font-extrabold text-axa-blue">{formatCurrency(quote.annualPremium)}</p>
              </div>
            ) : null}
          </div>

          {/* ─── PBI method badge ─── */}
          {isDeposit && pbiMethod && (
            <div
              className="mt-4 flex justify-center animate-slide-up"
              style={{ animationDelay: '0.25s' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-axa-grey-50 border border-axa-grey-200 text-xs text-axa-grey-500">
                {isSepaPbi
                  ? <><Building2 size={12} className="text-axa-blue" /> Recurring via SEPA Direct Debit</>
                  : <><CreditCard size={12} className="text-axa-blue" /> Recurring via saved card</>
                }
              </div>
            </div>
          )}

          {/* ─── Instalment schedule (PBI) ─── */}
          {isDeposit && quote && (
            <div
              className="mt-6 custom-glass rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={14} className="text-axa-blue" />
                <span className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase">
                  {isSepaPbi ? 'Direct Debit Schedule' : 'Card Payment Schedule'}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {Array.from({ length: 11 }, (_, i) => {
                  const date = new Date(quote.startDate);
                  date.setMonth(date.getMonth() + 1 + i);
                  const month = date.toLocaleDateString('en-IE', { month: 'short' });
                  const year = date.getFullYear().toString().slice(-2);
                  const instalmentAmount = quote.remainingBalance / 11;
                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 w-20 bg-axa-grey-50 border border-axa-grey-200 rounded-xl p-3 text-center hover:border-axa-blue/30 hover:bg-axa-blue/[0.03] transition-colors"
                    >
                      <p className="text-[10px] text-axa-grey-400 uppercase font-semibold">{month} '{year}</p>
                      <p className="text-xs font-bold text-axa-grey-600 mt-1">{formatCurrency(instalmentAmount)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-axa-grey-400">
                {isSepaPbi
                  ? <><Building2 size={12} /> Each payment will be debited from your bank account via SEPA</>
                  : <><CreditCard size={12} /> Each payment will be charged to your saved card automatically</>
                }
              </div>
            </div>
          )}

          {/* ─── Policy details ─── */}
          {quote && (
            <div
              className="mt-6 custom-glass rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: '0.35s' }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Shield size={14} className="text-axa-blue" />
                <span className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase">Policy Details</span>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: 'Policyholder', value: quote.customerName },
                  { label: 'Vehicle', value: `${quote.vehicleMake} ${quote.vehicleModel} (${quote.vehicleYear})` },
                  { label: 'Registration', value: quote.vehicleReg },
                  { label: 'Cover Period', value: `${quote.startDate} — ${quote.endDate}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] text-axa-grey-300 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-axa-grey-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── What's Next ─── */}
          <div
            className="mt-6 custom-glass rounded-2xl p-6 animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={14} className="text-axa-blue" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-axa-grey-400 uppercase">What Happens Next</span>
            </div>

            <div className="space-y-0">
              {[
                { icon: Mail, text: "You'll receive your policy documents via email", time: 'Within minutes' },
                { icon: FileText, text: `Your motor insurance cover begins on ${quote?.startDate ?? 'your start date'}`, time: 'Cover start' },
                { icon: Download, text: 'Download your insurance disc from your AXA account', time: 'Available now' },
              ].map(({ icon: Icon, text, time }, i) => (
                <div key={i} className="flex gap-4 items-start relative">
                  {i < 2 && (
                    <div className="absolute left-[19px] top-[40px] w-px h-[calc(100%-12px)] bg-gradient-to-b from-axa-grey-200 to-transparent" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-axa-grey-50 border border-axa-grey-200 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-axa-grey-400" />
                  </div>
                  <div className="pb-6">
                    <p className="text-sm text-axa-grey-600">{text}</p>
                    <p className="text-[10px] text-axa-grey-300 mt-0.5 uppercase tracking-wider font-semibold">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── CTA ─── */}
          <div className="mt-10 flex justify-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="px-8 py-4 custom-btn-primary rounded-xl font-bold text-sm flex items-center gap-2"
            >
              Start New Demo
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
