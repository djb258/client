/**
 * Intake type definitions for the client intake wizard.
 * These types define the intake wizard data shapes.
 */

export interface HRTone {
  tone?: 'formal' | 'professional' | 'friendly' | 'casual';
  preferred_salutation?: string;
  communication_style?: string;
  sample_phrases?: string[];
}

export interface CompanyDocument {
  company_id?: string;
  company_name: string;
  ein?: string;
  address?: string;
  industry?: string;
  internal_group_number?: string;
  vendor_group_numbers?: Record<string, string>;
  renewal_date?: Date;
  hr_tone?: HRTone;
}

export interface EmployeeDocument {
  company_id?: string;
  first_name: string;
  last_name: string;
  internal_employee_number?: string;
  benefit_type?: string;
  coverage_tier?: string;
  vendor_employee_ids?: Record<string, string>;
  dependents?: unknown[];
}

export interface WizardStep {
  step_number: number;
  step_name: string;
  completed: boolean;
  data: unknown;
}

export interface WizardState {
  current_step: number;
  company_data: Partial<CompanyDocument>;
  employee_data: Partial<EmployeeDocument>[];
  steps: WizardStep[];
}
