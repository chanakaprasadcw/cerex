// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../../types';
import React from 'react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-32 sm:pr-40' : ''}`}>
            {stepIdx < currentStep - 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-blue-600" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full">
                  {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                  {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                  <ion-icon name="checkmark-outline" className="w-5 h-5 text-white"></ion-icon>
                </div>
                <span className="absolute mt-2 text-sm font-medium text-blue-400 w-32 text-center -translate-x-1/2 left-1/2">{step}</span>
              </>
            ) : stepIdx === currentStep - 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-700" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-gray-800 border-2 border-blue-600 rounded-full">
                  <span className="h-2.5 w-2.5 bg-blue-600 rounded-full" />
                </div>
                 <span className="absolute mt-2 text-sm font-medium text-white w-32 text-center -translate-x-1/2 left-1/2">{step}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-700" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-gray-800 border-2 border-gray-600 rounded-full">
                </div>
                 <span className="absolute mt-2 text-sm font-medium text-gray-500 w-32 text-center -translate-x-1/2 left-1/2">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};