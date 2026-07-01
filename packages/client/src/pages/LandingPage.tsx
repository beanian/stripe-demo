import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Palette, Sparkles, Wallet, Target } from 'lucide-react';
import { ROUTES } from '../lib/constants';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center py-20 animate-fade-in">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-axa-blue bg-axa-blue/[0.06] px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
        Stripe Integration Demo
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-axa-dark tracking-tight leading-tight max-w-2xl">
        AXA Motor Insurance<br />
        <span className="text-axa-blue">Payment Experience</span>
      </h1>

      <p className="mt-5 max-w-xl text-axa-grey-700 leading-relaxed">
        Compare three Stripe integration approaches side by side.
        Path A uses Embedded Checkout, Path B uses Stripe Elements for branding control,
        and Path C showcases a premium custom experience with deep brand integration.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(ROUTES.QUOTE)}
          className="bg-axa-blue text-white text-base font-semibold px-7 py-3.5 rounded-axa hover:bg-axa-blue/90 transition-all shadow-axa-md hover:shadow-axa-lg flex items-center justify-center gap-2"
        >
          Start Demo
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        <div className="card-elevated p-5 text-left">
          <Layers size={20} className="text-axa-grey-500 mb-2" />
          <p className="font-semibold text-sm text-axa-dark">Path A: Checkout</p>
          <p className="text-xs text-axa-grey-700 mt-1 leading-relaxed">Stripe-hosted iframe. Minimal code, pre-built UI.</p>
        </div>
        <div className="card-elevated p-5 text-left">
          <Palette size={20} className="text-axa-blue mb-2" />
          <p className="font-semibold text-sm text-axa-dark">Path B: Elements</p>
          <p className="text-xs text-axa-grey-700 mt-1 leading-relaxed">Native form with full branding, PBI support, SEPA DD.</p>
        </div>
        <div className="card-elevated p-5 text-left border-[#D4A843]/20">
          <Sparkles size={20} className="text-[#D4A843] mb-2" />
          <p className="font-semibold text-sm text-axa-dark">Path C: Custom</p>
          <p className="text-xs text-axa-grey-700 mt-1 leading-relaxed">Premium dark-themed experience with deep brand integration.</p>
        </div>
      </div>

      <div className="mt-6 max-w-2xl w-full">
        <div className="text-[10px] font-bold tracking-[0.15em] text-axa-grey-400 uppercase mb-3">
          Self-Serve · post-purchase
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
              Manage saved cards and set the default used for instalments &amp; renewals.
              Demonstrates the Checkout Session (setup mode) add-card flow and the "Set as default"
              orchestration described in pin #5 of the integration spotlight.
            </p>
          </div>
          <ArrowRight size={16} className="text-axa-grey-400 group-hover:text-axa-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>

      <div className="mt-6 max-w-2xl w-full">
        <div className="text-[10px] font-bold tracking-[0.15em] text-axa-grey-400 uppercase mb-3">
          Design feasibility
        </div>
        <button
          onClick={() => navigate(ROUTES.SHOWCASE)}
          className="card-elevated p-5 w-full text-left flex items-center gap-4 hover:border-axa-blue hover:shadow-axa-lg transition-all group"
        >
          <div className="w-11 h-11 rounded-axa bg-axa-blue/10 flex items-center justify-center flex-shrink-0">
            <Target size={22} className="text-axa-blue" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-axa-dark">AXA Design in Stripe Elements</p>
            <p className="text-xs text-axa-grey-700 mt-1 leading-relaxed">
              A working reference build of the AXA mockup with a single PaymentElement, beside a
              mapping of each design element to its Stripe option — a shared starting point for
              scoping the build with the team.
            </p>
          </div>
          <ArrowRight size={16} className="text-axa-grey-400 group-hover:text-axa-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>

      <div className="mt-10 text-xs text-axa-grey-500 bg-axa-grey-50 border border-axa-grey-200 rounded-axa px-5 py-3 max-w-sm">
        This app runs in Stripe test mode. No real payments will be processed.
      </div>
    </div>
  );
}
