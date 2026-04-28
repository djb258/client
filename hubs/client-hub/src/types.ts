export interface Env {
  DB: D1Database;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface TableConfig {
  name: string;
  pk: string;
  columns: string[];
  jsonColumns?: string[];
  requiredOnCreate?: string[];
  uuidFields?: string[];
  readOnly?: boolean;
  supportsDelete?: boolean;
  autoTimestamps?: {
    createdAt?: boolean;
    updatedAt?: boolean;
  };
}

export interface Client {
  client_id: string;
  legal_name: string;
  fein: string | null;
  domicile_state: string | null;
  effective_date: string | null;
  status: string;
  source: string | null;
  version: number;
  domain: string | null;
  label_override: string | null;
  logo_url: string | null;
  color_primary: string | null;
  color_accent: string | null;
  feature_flags: JsonObject;
  dashboard_blocks: unknown[];
  created_at: string;
  updated_at: string;
}

export interface ClientError {
  client_error_id: string;
  client_id: string;
  source_entity: string;
  source_id: string | null;
  error_code: string;
  error_message: string;
  severity: string;
  status: string;
  context: JsonObject | null;
  created_at: string;
}

export interface Plan {
  plan_id: string;
  client_id: string;
  benefit_type: string;
  carrier_id: string | null;
  effective_date: string | null;
  status: string;
  version: number;
  rate_ee: string | null;
  rate_es: string | null;
  rate_ec: string | null;
  rate_fam: string | null;
  employer_rate_ee: string | null;
  employer_rate_es: string | null;
  employer_rate_ec: string | null;
  employer_rate_fam: string | null;
  source_quote_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanError {
  plan_error_id: string;
  client_id: string;
  source_entity: string;
  source_id: string | null;
  error_code: string;
  error_message: string;
  severity: string;
  status: string;
  context: JsonObject | null;
  created_at: string;
}

export interface PlanQuote {
  plan_quote_id: string;
  client_id: string;
  benefit_type: string;
  carrier_id: string;
  effective_year: number;
  rate_ee: string | null;
  rate_es: string | null;
  rate_ec: string | null;
  rate_fam: string | null;
  source: string | null;
  received_date: string | null;
  status: string;
  created_at: string;
}

export interface Person {
  person_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  ssn_hash: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeError {
  employee_error_id: string;
  client_id: string;
  source_entity: string;
  source_id: string | null;
  error_code: string;
  error_message: string;
  severity: string;
  status: string;
  context: JsonObject | null;
  created_at: string;
}

export interface Election {
  election_id: string;
  client_id: string;
  person_id: string;
  plan_id: string;
  coverage_tier: string;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentIntake {
  enrollment_intake_id: string;
  client_id: string;
  upload_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface IntakeRecord {
  intake_record_id: string;
  client_id: string;
  enrollment_intake_id: string;
  raw_payload: JsonObject;
  created_at: string;
}

export interface Vendor {
  vendor_id: string;
  client_id: string;
  vendor_name: string;
  vendor_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorError {
  vendor_error_id: string;
  client_id: string;
  source_entity: string;
  source_id: string | null;
  error_code: string;
  error_message: string;
  severity: string;
  status: string;
  context: JsonObject | null;
  created_at: string;
}

export interface ExternalIdentityMap {
  external_identity_id: string;
  client_id: string;
  entity_type: string;
  internal_id: string;
  vendor_id: string;
  external_id_value: string;
  effective_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  invoice_id: string;
  client_id: string;
  vendor_id: string;
  invoice_number: string;
  amount: number;
  invoice_date: string;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  service_request_id: string;
  client_id: string;
  category: string;
  status: string;
  opened_at: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceError {
  service_error_id: string;
  client_id: string;
  source_entity: string;
  source_id: string | null;
  error_code: string;
  error_message: string;
  severity: string;
  status: string;
  context: JsonObject | null;
  created_at: string;
}
