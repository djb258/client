-- Client Intake Wizard Schema for client_subhive
-- Barton Doctrine (IMO + ORBT) – Manual intake with Composio validation

-- =====================================================
-- COMPANY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_subhive.company (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  ein TEXT,
  address TEXT,
  industry TEXT,
  internal_group_number TEXT,
  vendor_group_numbers JSONB DEFAULT '{}', -- { "vendor_a": "ABC123", "vendor_b": "XYZ789" }
  renewal_date DATE,
  hr_tone JSONB DEFAULT '{}', -- { "tone": "formal", "phrases": [...] }
  composio_job_id TEXT,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for lookup by internal group number
CREATE INDEX IF NOT EXISTS idx_company_internal_group_number
  ON client_subhive.company(internal_group_number);

-- Index for EIN lookup
CREATE INDEX IF NOT EXISTS idx_company_ein
  ON client_subhive.company(ein);

-- Index for validation status
CREATE INDEX IF NOT EXISTS idx_company_validated
  ON client_subhive.company(validated);

-- =====================================================
-- EMPLOYEE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_subhive.employee (
  employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES client_subhive.company(company_id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  internal_employee_number TEXT,
  vendor_employee_ids JSONB DEFAULT '{}', -- { "vendor_a": "EMP001", "vendor_b": "E9999" }
  benefit_type TEXT, -- medical, dental, vision, life, etc.
  coverage_tier TEXT, -- employee, employee+spouse, employee+child, family
  dependents JSONB DEFAULT '[]', -- [{ "name": "John Doe", "relationship": "spouse", "dob": "1985-05-15" }]
  composio_job_id TEXT,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for company lookup
CREATE INDEX IF NOT EXISTS idx_employee_company_id
  ON client_subhive.employee(company_id);

-- Index for internal employee number
CREATE INDEX IF NOT EXISTS idx_employee_internal_number
  ON client_subhive.employee(internal_employee_number);

-- Index for validation status
CREATE INDEX IF NOT EXISTS idx_employee_validated
  ON client_subhive.employee(validated);

-- Index for benefit type queries
CREATE INDEX IF NOT EXISTS idx_employee_benefit_type
  ON client_subhive.employee(benefit_type);

-- =====================================================
-- AUDIT LOG TABLE (optional but recommended)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_subhive.intake_audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'company' or 'employee'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'validate', 'promote', 'update'
  composio_job_id TEXT,
  success BOOLEAN,
  errors JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- Index for entity lookup
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON client_subhive.intake_audit_log(entity_type, entity_id);

-- Index for composio job tracking
CREATE INDEX IF NOT EXISTS idx_audit_composio_job
  ON client_subhive.intake_audit_log(composio_job_id);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION client_subhive.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_modtime
  BEFORE UPDATE ON client_subhive.company
  FOR EACH ROW
  EXECUTE FUNCTION client_subhive.update_modified_column();

CREATE TRIGGER update_employee_modtime
  BEFORE UPDATE ON client_subhive.employee
  FOR EACH ROW
  EXECUTE FUNCTION client_subhive.update_modified_column();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE client_subhive.company IS 'Company master data for client intake wizard';
COMMENT ON TABLE client_subhive.employee IS 'Employee census data for client intake wizard';
COMMENT ON TABLE client_subhive.intake_audit_log IS 'Audit trail for all intake validation and promotion operations';
COMMENT ON COLUMN client_subhive.company.vendor_group_numbers IS 'JSONB object mapping vendor names to group numbers';
COMMENT ON COLUMN client_subhive.company.hr_tone IS 'JSONB structure defining HR communication style and sample phrases';
COMMENT ON COLUMN client_subhive.employee.vendor_employee_ids IS 'JSONB object mapping vendor names to employee IDs';
COMMENT ON COLUMN client_subhive.employee.dependents IS 'JSONB array of dependent information';