import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = ['Quote', 'Payment', 'Confirmation'] as const;

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-axa-green text-white'
                    : isCurrent
                      ? 'bg-axa-blue text-white shadow-axa'
                      : 'border-2 border-axa-grey-300 text-axa-grey-500'
                }`}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-medium ${
                  isCurrent ? 'text-axa-blue' : isCompleted ? 'text-axa-green' : 'text-axa-grey-500'
                }`}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`w-14 h-0.5 mx-2 rounded-full transition-colors ${
                  stepNum < currentStep ? 'bg-axa-green' : 'bg-axa-grey-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
