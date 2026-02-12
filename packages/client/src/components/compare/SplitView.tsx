import type { ReactNode } from 'react';

interface SplitViewProps {
  left: ReactNode;
  right: ReactNode;
}

export default function SplitView({ left, right }: SplitViewProps) {
  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-1 min-h-[400px]">{left}</div>
      {/* divider */}
      <div className="hidden md:block w-px bg-axa-grey-300 mx-4" />
      <div className="block md:hidden h-px bg-axa-grey-300 my-4" />
      <div className="flex-1 min-h-[400px]">{right}</div>
    </div>
  );
}
