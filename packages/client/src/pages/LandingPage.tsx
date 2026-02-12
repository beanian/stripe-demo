import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Palette, Sparkles } from 'lucide-react';
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

      <div className="mt-10 text-xs text-axa-grey-500 bg-axa-grey-50 border border-axa-grey-200 rounded-axa px-5 py-3 max-w-sm">
        This app runs in Stripe test mode. No real payments will be processed.
      </div>
    </div>
  );
}
