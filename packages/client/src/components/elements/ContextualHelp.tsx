import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Is this payment secure?',
    answer:
      'Yes. Your payment is processed by Stripe, a PCI Level 1 certified payment processor. Your card details are encrypted and never touch our servers.',
  },
  {
    question: 'Can I change my payment schedule later?',
    answer:
      'Yes. You can switch between Pay in Full and PBI by contacting AXA customer support or through your online account.',
  },
  {
    question: 'What happens after I pay?',
    answer:
      'You will receive your policy documents via email within minutes. Your motor insurance cover begins on the start date shown in your quote.',
  },
];

export default function ContextualHelp() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-axa-grey-700 hover:bg-axa-grey-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={15} />
          Common Questions
        </span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h4 className="text-sm font-semibold text-axa-dark">{faq.question}</h4>
              <p className="mt-1 text-sm text-axa-grey-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
