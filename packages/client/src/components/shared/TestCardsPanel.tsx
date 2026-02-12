import { useState } from 'react';
import { ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';

const testCards = [
  { number: '4242 4242 4242 4242', scenario: 'Success' },
  { number: '4000 0000 0000 9995', scenario: 'Decline' },
  { number: '4000 0025 0000 3155', scenario: '3D Secure' },
];

const testIbans = [
  { iban: 'AT611904300234573201', scenario: 'Success' },
  { iban: 'AT321904300235473204', scenario: 'Failure' },
];

export default function TestCardsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-axa-grey-700 hover:bg-axa-grey-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FlaskConical size={14} />
          Test Credentials
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          <div>
            <p className="text-xs font-semibold text-axa-grey-500 uppercase tracking-wide mb-2">Cards</p>
            <table className="w-full text-sm">
              <tbody>
                {testCards.map((card) => (
                  <tr key={card.number} className="border-t border-axa-grey-100">
                    <td className="py-1.5 font-mono text-xs text-axa-dark">{card.number}</td>
                    <td className="py-1.5 text-xs text-axa-grey-700 text-right">{card.scenario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-[11px] text-axa-grey-500">Any future expiry, any CVC</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-axa-grey-500 uppercase tracking-wide mb-2">SEPA IBANs</p>
            <table className="w-full text-sm">
              <tbody>
                {testIbans.map((item) => (
                  <tr key={item.iban} className="border-t border-axa-grey-100">
                    <td className="py-1.5 font-mono text-xs text-axa-dark">{item.iban}</td>
                    <td className="py-1.5 text-xs text-axa-grey-700 text-right">{item.scenario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
