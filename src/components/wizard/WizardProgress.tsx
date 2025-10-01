// Wizard Progress Indicator Component

import React from 'react';
import { WizardStep } from '../../firebase/types/firestore';

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
}

const WizardProgress: React.FC<WizardProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="wizard-progress">
      <div className="progress-bar">
        {steps.map((step, index) => (
          <div
            key={step.step_number}
            className={`progress-step ${
              step.step_number === currentStep
                ? 'active'
                : step.completed
                ? 'completed'
                : 'pending'
            }`}
          >
            <div className="step-circle">
              {step.completed ? '✓' : step.step_number}
            </div>
            <div className="step-label">{step.step_name}</div>
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  step.completed ? 'completed' : 'pending'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WizardProgress;