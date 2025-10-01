// Step 1: Company Setup

import React, { useState } from 'react';
import { CompanyDocument } from '../../../firebase/types/firestore';

interface CompanySetupStepProps {
  companyData: Partial<CompanyDocument>;
  onNext: (data: Partial<CompanyDocument>) => void;
  onCancel?: () => void;
}

const CompanySetupStep: React.FC<CompanySetupStepProps> = ({
  companyData,
  onNext,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<CompanyDocument>>(companyData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CompanyDocument, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVendorGroupChange = (vendor: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vendor_group_numbers: {
        ...prev.vendor_group_numbers,
        [vendor]: value
      }
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name?.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (formData.ein && !/^\d{2}-\d{7}$/.test(formData.ein)) {
      newErrors.ein = 'EIN must be in format XX-XXXXXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <div className="wizard-step company-setup-step">
      <h2>Step 1: Company Information</h2>
      <p>Enter the basic details for the new client company.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="company_name">
            Company Name <span className="required">*</span>
          </label>
          <input
            id="company_name"
            type="text"
            value={formData.company_name || ''}
            onChange={e => handleChange('company_name', e.target.value)}
            placeholder="Acme Corporation"
          />
          {errors.company_name && <span className="error">{errors.company_name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="ein">EIN (Employer Identification Number)</label>
          <input
            id="ein"
            type="text"
            value={formData.ein || ''}
            onChange={e => handleChange('ein', e.target.value)}
            placeholder="12-3456789"
          />
          {errors.ein && <span className="error">{errors.ein}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="address">Company Address</label>
          <textarea
            id="address"
            value={formData.address || ''}
            onChange={e => handleChange('address', e.target.value)}
            placeholder="123 Main St, City, State 12345"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="industry">Industry</label>
          <input
            id="industry"
            type="text"
            value={formData.industry || ''}
            onChange={e => handleChange('industry', e.target.value)}
            placeholder="Technology, Healthcare, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="internal_group_number">Internal Group Number</label>
          <input
            id="internal_group_number"
            type="text"
            value={formData.internal_group_number || ''}
            onChange={e => handleChange('internal_group_number', e.target.value)}
            placeholder="GRP-001"
          />
        </div>

        <div className="form-group">
          <label htmlFor="renewal_date">Renewal Date</label>
          <input
            id="renewal_date"
            type="date"
            value={formData.renewal_date ? formData.renewal_date.toString().split('T')[0] : ''}
            onChange={e => handleChange('renewal_date', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>

        <div className="form-section">
          <h3>Vendor Group Numbers</h3>
          <p className="help-text">
            Assign group numbers for each vendor this company works with.
          </p>

          {['Vendor A', 'Vendor B', 'Vendor C'].map(vendor => (
            <div key={vendor} className="form-group vendor-group">
              <label htmlFor={`vendor_${vendor}`}>{vendor}</label>
              <input
                id={`vendor_${vendor}`}
                type="text"
                value={formData.vendor_group_numbers?.[vendor] || ''}
                onChange={e => handleVendorGroupChange(vendor, e.target.value)}
                placeholder="ABC123"
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary">
            Next: HR Tone Setup
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySetupStep;