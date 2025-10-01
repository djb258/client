// Step 3: Employee Intake (CSV upload or manual entry)

import React, { useState } from 'react';
import { EmployeeDocument } from '../../../firebase/types/firestore';

interface EmployeeIntakeStepProps {
  companyId: string;
  employees: Partial<EmployeeDocument>[];
  onNext: (data: Partial<EmployeeDocument>[]) => void;
  onBack: () => void;
}

const EmployeeIntakeStep: React.FC<EmployeeIntakeStepProps> = ({
  companyId,
  employees,
  onNext,
  onBack
}) => {
  const [employeeList, setEmployeeList] = useState<Partial<EmployeeDocument>[]>(employees);
  const [uploadMode, setUploadMode] = useState<'csv' | 'manual'>('manual');

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const employees: Partial<EmployeeDocument>[] = lines
          .slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            const employee: Partial<EmployeeDocument> = {
              company_id: companyId,
              first_name: '',
              last_name: '',
              vendor_employee_ids: {},
              dependents: []
            };

            headers.forEach((header, index) => {
              const value = values[index];
              if (header === 'first_name') employee.first_name = value;
              else if (header === 'last_name') employee.last_name = value;
              else if (header === 'internal_employee_number') employee.internal_employee_number = value;
              else if (header === 'benefit_type') employee.benefit_type = value;
              else if (header === 'coverage_tier') employee.coverage_tier = value as any;
            });

            return employee;
          });

        setEmployeeList(employees);
      } catch (error) {
        alert('Error parsing CSV file. Please check the format.');
        console.error('CSV parse error:', error);
      }
    };

    reader.readAsText(file);
  };

  const addManualEmployee = () => {
    setEmployeeList(prev => [
      ...prev,
      {
        company_id: companyId,
        first_name: '',
        last_name: '',
        vendor_employee_ids: {},
        dependents: []
      }
    ]);
  };

  const updateEmployee = (index: number, field: keyof EmployeeDocument, value: any) => {
    setEmployeeList(prev =>
      prev.map((emp, i) => (i === index ? { ...emp, [field]: value } : emp))
    );
  };

  const removeEmployee = (index: number) => {
    setEmployeeList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate employees
    const valid = employeeList.every(
      emp => emp.first_name?.trim() && emp.last_name?.trim()
    );

    if (!valid) {
      alert('All employees must have a first and last name.');
      return;
    }

    onNext(employeeList);
  };

  return (
    <div className="wizard-step employee-intake-step">
      <h2>Step 3: Employee Census</h2>
      <p>Upload employee data via CSV or enter manually.</p>

      <div className="upload-mode-selector">
        <button
          type="button"
          className={uploadMode === 'manual' ? 'active' : ''}
          onClick={() => setUploadMode('manual')}
        >
          Manual Entry
        </button>
        <button
          type="button"
          className={uploadMode === 'csv' ? 'active' : ''}
          onClick={() => setUploadMode('csv')}
        >
          CSV Upload
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {uploadMode === 'csv' && (
          <div className="csv-upload-section">
            <label htmlFor="csv-file" className="file-upload-label">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
              />
              <span>Choose CSV File</span>
            </label>
            <p className="help-text">
              Expected columns: first_name, last_name, internal_employee_number,
              benefit_type, coverage_tier
            </p>
          </div>
        )}

        {uploadMode === 'manual' && (
          <button
            type="button"
            onClick={addManualEmployee}
            className="btn-add-employee"
          >
            + Add Employee
          </button>
        )}

        {employeeList.length > 0 && (
          <div className="employee-list">
            <h3>Employees ({employeeList.length})</h3>
            {employeeList.map((emp, index) => (
              <div key={index} className="employee-card">
                <div className="employee-fields">
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={emp.first_name || ''}
                    onChange={e => updateEmployee(index, 'first_name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={emp.last_name || ''}
                    onChange={e => updateEmployee(index, 'last_name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Employee Number"
                    value={emp.internal_employee_number || ''}
                    onChange={e =>
                      updateEmployee(index, 'internal_employee_number', e.target.value)
                    }
                  />
                  <select
                    value={emp.benefit_type || ''}
                    onChange={e => updateEmployee(index, 'benefit_type', e.target.value)}
                  >
                    <option value="">Benefit Type</option>
                    <option value="medical">Medical</option>
                    <option value="dental">Dental</option>
                    <option value="vision">Vision</option>
                    <option value="life">Life</option>
                  </select>
                  <select
                    value={emp.coverage_tier || ''}
                    onChange={e => updateEmployee(index, 'coverage_tier', e.target.value)}
                  >
                    <option value="">Coverage Tier</option>
                    <option value="employee">Employee</option>
                    <option value="employee+spouse">Employee + Spouse</option>
                    <option value="employee+child">Employee + Child</option>
                    <option value="family">Family</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeEmployee(index)}
                  className="btn-remove-employee"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onBack} className="btn-secondary">
            Back
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={employeeList.length === 0}
          >
            Next: Review & Confirm
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeIntakeStep;