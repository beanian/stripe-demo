import { Columns } from 'lucide-react';
import SplitView from '../components/compare/SplitView';
import PathPanel from '../components/compare/PathPanel';
import TestCardsPanel from '../components/shared/TestCardsPanel';

export default function ComparePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Columns size={24} className="text-axa-blue" />
          <h1 className="text-2xl font-bold text-axa-dark">Compare Payment Paths</h1>
        </div>
        <p className="mt-1 text-axa-grey-700">See both approaches side by side</p>
      </div>

      {/* Side-by-side panels */}
      <SplitView
        left={<PathPanel path="A" />}
        right={<PathPanel path="B" />}
      />

      {/* Bottom section */}
      <div className="mt-8">
        <TestCardsPanel />
      </div>
    </div>
  );
}
