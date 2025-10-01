// Firebase Firestore TypeScript Types for Client Intake Wizard
// Project: client_intake

import { Timestamp } from 'firebase/firestore';

// =====================================================
// COMPANY DOCUMENT TYPE
// =====================================================
export interface CompanyDocument {
  company_id: string; // UUID assigned by Firebase
  company_name: string;
  ein?: string;
  address?: string;
  industry?: string;
  internal_group_number?: string;
  vendor_group_numbers: Record<string, string>; // { vendor_a: "ABC123" }
  renewal_date?: Date | Timestamp;
  hr_tone: HRTone;
  composio_job_id?: string;
  validated: boolean;
  promoted_to_neon: boolean;
  last_touched: Date | Timestamp;
  created_at?: Date | Timestamp;
}

export interface HRTone {
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
  sample_phrases?: string[];
  communication_style?: string;
  preferred_salutation?: string;
}

// =====================================================
// EMPLOYEE DOCUMENT TYPE
// =====================================================
export interface EmployeeDocument {
  employee_id: string; // UUID assigned by Firebase
  company_id: string; // FK to company document
  first_name: string;
  last_name: string;
  internal_employee_number?: string;
  vendor_employee_ids: Record<string, string>; // { vendor_a: "EMP001" }
  benefit_type?: string; // medical, dental, vision, life, etc.
  coverage_tier?: 'employee' | 'employee+spouse' | 'employee+child' | 'family';
  dependents: Dependent[];
  composio_job_id?: string;
  validated: boolean;
  promoted_to_neon: boolean;
  last_touched: Date | Timestamp;
  created_at?: Date | Timestamp;
}

export interface Dependent {
  name: string;
  relationship: 'spouse' | 'child' | 'domestic_partner' | 'other';
  dob: string; // ISO date string
  ssn?: string; // Optional, handle with care
}

// =====================================================
// AUDIT LOG DOCUMENT TYPE
// =====================================================
export interface IntakeAuditLogDocument {
  log_id: string; // UUID
  entity_type: 'company' | 'employee';
  entity_id: string;
  action: 'validate' | 'promote' | 'update' | 'create';
  composio_job_id?: string;
  success: boolean;
  errors: string[];
  metadata: Record<string, any>;
  created_at: Date | Timestamp;
}

// =====================================================
// COMPOSIO RESPONSE TYPES
// =====================================================
export interface ComposioValidateResponse {
  success: boolean;
  job_id: string;
  errors: string[];
  validated: boolean;
}

export interface ComposioPromoteResponse {
  success: boolean;
  job_id: string;
  errors: string[];
  promoted_table: 'company' | 'employee';
  neon_id?: string; // UUID in Neon
}

// =====================================================
// WIZARD STEP TYPES
// =====================================================
export interface WizardStep {
  step_number: 1 | 2 | 3 | 4;
  step_name: 'Company Setup' | 'HR Tone Setup' | 'Employee Intake' | 'Review & Confirm';
  completed: boolean;
  data: Partial<CompanyDocument> | Partial<EmployeeDocument>[];
}

export interface WizardState {
  current_step: number;
  company_data: Partial<CompanyDocument>;
  employee_data: Partial<EmployeeDocument>[];
  steps: WizardStep[];
}