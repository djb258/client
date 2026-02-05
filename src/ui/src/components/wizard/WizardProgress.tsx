/*
 * CTB Metadata
 * ctb_id: CTB-5D81BFE9190B
 * ctb_branch: ui
 * ctb_path: ui/src/components/wizard/WizardProgress.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.938386
 * checksum: 713c4a8b
 */

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