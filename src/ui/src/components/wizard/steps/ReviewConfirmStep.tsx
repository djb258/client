/*
 * CTB Metadata
 * ctb_id: CTB-612E91787372
 * ctb_branch: ui
 * ctb_path: ui/src/components/wizard/steps/ReviewConfirmStep.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.926700
 * checksum: c39b6d1d
 */

// Step 4: Review & Confirm - Final step before promotion to Neon

import React, { useState } from 'react';
import { CompanyDocument, EmployeeDocument } from '../../../firebase/types/firestore';
import {
  createCompanyInFirebase,
  validateCompanyInFirebase,
  promoteCompanyToNeon,
  createEmployeeInFirebase,
  validateEmployeeInFirebase,
  promoteEmployeeToNeon
} from '../../../services/firebase/intake-service';

interface ReviewConfirmStepProps {
  companyData: Partial<CompanyDocument>;
  employeeData: Partial<EmployeeDocument>[];
  onConfirm?: () => void;
  onBack: () => void;
}

const ReviewConfirmStep: React.FC<ReviewConfirmStepProps> = ({
  companyData,
  employeeData,
  onConfirm,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setProgress(['Starting client intake process...']);
    setErrors([]);

    try {
      // Step 1: Create company in Firebase
      setProgress(prev => [...prev, 'Creating company record in Firebase...']);
      const company = await createCompanyInFirebase(companyData as any);

      // Step 2: Validate company
      setProgress(prev => [...prev, 'Validating company data via Composio...']);
      const companyValidation = await validateCompanyInFirebase(company.company_id);

      if (!companyValidation.success) {
        setErrors(prev => [...prev, ...companyValidation.errors]);
        setProgress(prev => [...prev, 'Company validation failed.']);
        return;
      }

      // Step 3: Promote company to Neon
      setProgress(prev => [...prev, 'Promoting company to Neon database...']);
      const companyPromotion = await promoteCompanyToNeon(company.company_id);

      if (!companyPromotion.success) {
        setErrors(prev => [...prev, ...companyPromotion.errors]);
        setProgress(prev => [...prev, 'Company promotion failed.']);
        return;
      }

      setProgress(prev => [
        ...prev,
        `Company promoted successfully! Neon ID: ${companyPromotion.neon_id}`
      ]);

      // Step 4: Process employees
      setProgress(prev => [
        ...prev,
        `Processing ${employeeData.length} employees...`
      ]);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < employeeData.length; i++) {
        const empData = employeeData[i];
        setProgress(prev => [
          ...prev,
          `Processing employee ${i + 1}/${employeeData.length}: ${empData.first_name} ${empData.last_name}`
        ]);

        try {
          // Create in Firebase
          const employee = await createEmployeeInFirebase({
            ...empData,
            company_id: company.company_id
          } as any);

          // Validate
          const empValidation = await validateEmployeeInFirebase(employee.employee_id);
          if (!empValidation.success) {
            throw new Error(empValidation.errors.join(', '));
          }

          // Promote
          const empPromotion = await promoteEmployeeToNeon(employee.employee_id);
          if (!empPromotion.success) {
            throw new Error(empPromotion.errors.join(', '));
          }

          successCount++;
        } catch (error) {
          failCount++;
          setErrors(prev => [
            ...prev,
            `Employee ${empData.first_name} ${empData.last_name}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          ]);
        }
      }

      setProgress(prev => [
        ...prev,
        `Employee processing complete: ${successCount} success, ${failCount} failed.`
      ]);

      if (failCount === 0) {
        setProgress(prev => [
          ...prev,
          '✓ Client intake completed successfully!'
        ]);
        setTimeout(() => {
          onConfirm?.();
        }, 2000);
      } else {
        setProgress(prev => [
          ...prev,
          '⚠ Client intake completed with errors. Please review.'
        ]);
      }
    } catch (error) {
      setErrors(prev => [
        ...prev,
        `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
      setProgress(prev => [...prev, '✗ Client intake failed.']);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="wizard-step review-confirm-step">
      <h2>Step 4: Review & Confirm</h2>
      <p>Review all information before promoting to Neon.</p>

      <div className="review-section">
        <h3>Company Information</h3>
        <dl>
          <dt>Company Name:</dt>
          <dd>{companyData.company_name}</dd>
          <dt>EIN:</dt>
          <dd>{companyData.ein || 'N/A'}</dd>
          <dt>Address:</dt>
          <dd>{companyData.address || 'N/A'}</dd>
          <dt>Industry:</dt>
          <dd>{companyData.industry || 'N/A'}</dd>
          <dt>Internal Group Number:</dt>
          <dd>{companyData.internal_group_number || 'N/A'}</dd>
          <dt>Renewal Date:</dt>
          <dd>
            {companyData.renewal_date
              ? new Date(companyData.renewal_date).toLocaleDateString()
              : 'N/A'}
          </dd>
          <dt>HR Tone:</dt>
          <dd>{companyData.hr_tone?.tone || 'N/A'}</dd>
        </dl>
      </div>

      <div className="review-section">
        <h3>Employee Census</h3>
        <p>{employeeData.length} employees to be imported</p>
        <div className="employee-summary">
          {employeeData.slice(0, 5).map((emp, index) => (
            <div key={index}>
              {emp.first_name} {emp.last_name} - {emp.benefit_type || 'No benefit'} (
              {emp.coverage_tier || 'No tier'})
            </div>
          ))}
          {employeeData.length > 5 && (
            <div>...and {employeeData.length - 5} more</div>
          )}
        </div>
      </div>

      {progress.length > 0 && (
        <div className="progress-log">
          <h3>Progress</h3>
          {progress.map((msg, index) => (
            <div key={index} className="progress-message">
              {msg}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="error-log">
          <h3>Errors</h3>
          {errors.map((err, index) => (
            <div key={index} className="error-message">
              {err}
            </div>
          ))}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="btn-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="btn-primary btn-confirm"
        >
          {isProcessing ? 'Processing...' : 'Confirm & Promote to Neon'}
        </button>
      </div>
    </div>
  );
};

export default ReviewConfirmStep;