/*
 * CTB Metadata
 * ctb_id: CTB-1CC9D08697E0
 * ctb_branch: ui
 * ctb_path: ui/src/components/wizard/IntakeWizard.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.895320
 * checksum: a59566bf
 */

// Client Intake Wizard - Main Component
// Multi-step wizard for onboarding new clients under Barton Doctrine

import React, { useState } from 'react';
import { WizardState } from '../../firebase/types/firestore';
import CompanySetupStep from './steps/CompanySetupStep';
import HRToneSetupStep from './steps/HRToneSetupStep';
import EmployeeIntakeStep from './steps/EmployeeIntakeStep';
import ReviewConfirmStep from './steps/ReviewConfirmStep';
import WizardProgress from './WizardProgress';

interface IntakeWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const IntakeWizard: React.FC<IntakeWizardProps> = ({ onComplete, onCancel }) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    current_step: 1,
    company_data: {
      company_name: '',
      ein: '',
      address: '',
      industry: '',
      internal_group_number: '',
      vendor_group_numbers: {},
      renewal_date: undefined,
      hr_tone: {}
    },
    employee_data: [],
    steps: [
      { step_number: 1, step_name: 'Company Setup', completed: false, data: {} },
      { step_number: 2, step_name: 'HR Tone Setup', completed: false, data: {} },
      { step_number: 3, step_name: 'Employee Intake', completed: false, data: [] },
      { step_number: 4, step_name: 'Review & Confirm', completed: false, data: {} }
    ]
  });

  const handleNext = () => {
    if (wizardState.current_step < 4) {
      setWizardState(prev => ({
        ...prev,
        current_step: prev.current_step + 1,
        steps: prev.steps.map((step, idx) =>
          idx === prev.current_step - 1 ? { ...step, completed: true } : step
        )
      }));
    }
  };

  const handleBack = () => {
    if (wizardState.current_step > 1) {
      setWizardState(prev => ({
        ...prev,
        current_step: prev.current_step - 1
      }));
    }
  };

  const handleStepComplete = (stepData: any) => {
    if (wizardState.current_step === 1 || wizardState.current_step === 2) {
      setWizardState(prev => ({
        ...prev,
        company_data: { ...prev.company_data, ...stepData }
      }));
    } else if (wizardState.current_step === 3) {
      setWizardState(prev => ({
        ...prev,
        employee_data: stepData
      }));
    }
    handleNext();
  };

  const renderStep = () => {
    switch (wizardState.current_step) {
      case 1:
        return (
          <CompanySetupStep
            companyData={wizardState.company_data}
            onNext={handleStepComplete}
            onCancel={onCancel}
          />
        );
      case 2:
        return (
          <HRToneSetupStep
            hrTone={wizardState.company_data.hr_tone || {}}
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <EmployeeIntakeStep
            companyId={wizardState.company_data.company_id || ''}
            employees={wizardState.employee_data}
            onNext={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ReviewConfirmStep
            companyData={wizardState.company_data}
            employeeData={wizardState.employee_data}
            onConfirm={onComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="intake-wizard-container">
      <div className="wizard-header">
        <h1>Client Intake Wizard</h1>
        <p>Onboard new clients under Barton Doctrine (IMO + ORBT)</p>
      </div>

      <WizardProgress
        steps={wizardState.steps}
        currentStep={wizardState.current_step}
      />

      <div className="wizard-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default IntakeWizard;