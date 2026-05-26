import { useNavigate } from 'react-router-dom';
import { Layers, Palette, Sparkles, Columns, Wallet, ArrowRight } from 'lucide-react';
import { useQuote } from '../contexts/QuoteContext';
import StepIndicator from '../components/shared/StepIndicator';
import QuoteSummaryCard from '../components/shared/QuoteSummaryCard';
import { ROUTES } from '../lib/constants';

const pathIcon = { A: Layers, B: Palette, C: Sparkles, compare: Columns } as const;

export default function QuotePage() {
  const { quote, loading, error, schedule, setPath } = useQuote();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-axa-grey-700">Loading quote...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-axa-red">{error || 'Quote not found'}</div>
      </div>
    );
  }

  const paths = [
    {
      key: 'A' as const,
      icon: pathIcon.A,
      title: 'Path A: Embedded Checkout',
      description: 'Stripe-hosted checkout iframe with minimal customisation. Fast to integrate with a pre-built, conversion-optimised UI.',
      route: ROUTES.CHECKOUT,
      pathId: 'A' as const,
    },
    {
      key: 'B' as const,
      icon: pathIcon.B,
      title: 'Path B: Stripe Elements',
      description: 'Native payment form built with Stripe Elements for full branding control. Supports PBI with deposit + SEPA Direct Debit.',
      route: ROUTES.ELEMENTS,
      pathId: 'B' as const,
    },
    {
      key: 'C' as const,
      icon: pathIcon.C,
      title: 'Path C: Custom Experience',
      description: 'Premium dark-themed checkout with deep brand integration. Showcases the maximum UX customisation achievable with Stripe Elements.',
      route: ROUTES.CUSTOM,
      pathId: 'C' as const,
    },
    {
      key: 'compare' as const,
      icon: pathIcon.compare,
      title: 'Compare Side by Side',
      description: 'View both payment paths side by side to compare UX, integration complexity, and customisation options.',
      route: ROUTES.COMPARE,
      pathId: null,
    },
  ];

  return (
    <div className="animate-fade-in">
      <StepIndicator currentStep={1} />

      <div className="mb-8">
        <QuoteSummaryCard quote={quote} schedule={schedule} />
      </div>

      <h2 className="text-xl font-bold text-axa-dark mb-4 tracking-tight">Choose Payment Path</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {paths.map((p) => {
          const Icon = p.icon;
          const iconColor =
            p.key === 'B' ? 'text-axa-blue' : p.key === 'C' ? 'text-axa-blue' : 'text-axa-grey-500';
          return (
            <div
              key={p.title}
              className="card-elevated p-5 flex flex-col hover:shadow-axa-lg transition-shadow"
            >
              <Icon size={22} className={`${iconColor} mb-2`} />
              <h3 className="text-base font-semibold text-axa-dark mb-1.5">{p.title}</h3>
              <p className="text-sm text-axa-grey-700 flex-1 mb-4 leading-relaxed">{p.description}</p>
              <button
                onClick={() => {
                  if (p.pathId) setPath(p.pathId);
                  navigate(p.route);
                }}
                className="bg-axa-blue text-white font-semibold text-sm px-4 py-2.5 rounded-axa hover:bg-axa-blue/90 transition-colors"
              >
                {p.pathId ? `Select Path ${p.pathId}` : 'Compare Paths'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Self-Serve section — distinct from checkout paths */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-axa-grey-200" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-axa-grey-400 uppercase">
            Self-Serve · post-purchase
          </span>
          <div className="h-px flex-1 bg-axa-grey-200" />
        </div>

        <button
          onClick={() => navigate(ROUTES.MYAXA_WALLET)}
          className="card-elevated p-5 w-full text-left flex items-center gap-4 hover:border-axa-blue hover:shadow-axa-lg transition-all group"
        >
          <div className="w-11 h-11 rounded-axa bg-axa-blue/10 flex items-center justify-center flex-shrink-0">
            <Wallet size={22} className="text-axa-blue" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-axa-dark">My AXA: Saved Cards</p>
            <p className="text-xs text-axa-grey-700 mt-1 leading-relaxed">
              Manage saved cards and set the default used for instalments &amp; renewals. Demonstrates
              the Checkout Session (setup mode) add-card flow and the "Set as default" orchestration
              from pin #5 of the integration spotlight.
            </p>
          </div>
          <ArrowRight size={16} className="text-axa-grey-400 group-hover:text-axa-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
