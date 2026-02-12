import { Lock, Shield, CreditCard } from 'lucide-react';

export default function TrustSignals() {
  const signals = [
    { icon: Lock, text: '256-bit encryption' },
    { icon: Shield, text: 'Regulated by Central Bank of Ireland' },
    { icon: CreditCard, text: 'Powered by Stripe' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-xs text-axa-grey-500">
      {signals.map(({ icon: Icon, text }) => (
        <span key={text} className="flex items-center gap-1.5">
          <Icon size={14} />
          {text}
        </span>
      ))}
    </div>
  );
}
