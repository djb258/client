-- ===================================================================
-- Migration: 15_clnt_seed_data.sql
-- Database: clnt
-- Purpose: Seed data for testing and development
-- Created: 2025-10-27
-- ===================================================================
-- PREREQUISITE: Connect to the 'clnt' database before running this migration
-- PREREQUISITE: All schema migrations (10-14) must be run first
-- ===================================================================

-- ===================================================================
-- SEED DATA: core.company_master
-- ===================================================================
INSERT INTO core.company_master (
  company_uid,
  company_name,
  ein,
  status,
  column_number,
  column_description,
  column_format
) VALUES
  ('CLNT-0001', 'Acme Benefits LLC', '12-3456789', 'active', 1, 'Primary test company', 'TEXT'),
  ('CLNT-0002', 'TechCorp Industries', '98-7654321', 'active', 2, 'Secondary test company', 'TEXT')
ON CONFLICT (company_uid) DO NOTHING;

-- ===================================================================
-- SEED DATA: core.employee_master
-- ===================================================================
INSERT INTO core.employee_master (
  employee_uid,
  company_uid,
  first_name,
  last_name,
  hire_date,
  employment_status,
  column_number,
  column_description,
  column_format
) VALUES
  ('EMP-0001', 'CLNT-0001', 'John', 'Smith', '2020-01-15', 'active', 1, 'Test employee 1', 'TEXT'),
  ('EMP-0002', 'CLNT-0001', 'Jane', 'Doe', '2021-03-20', 'active', 2, 'Test employee 2', 'TEXT'),
  ('EMP-0003', 'CLNT-0002', 'Bob', 'Johnson', '2019-06-01', 'active', 3, 'Test employee 3', 'TEXT')
ON CONFLICT (employee_uid) DO NOTHING;

-- ===================================================================
-- SEED DATA: core.entity_relationship
-- ===================================================================
INSERT INTO core.entity_relationship (
  from_entity_uid,
  to_entity_uid,
  relationship_type,
  effective_date,
  status
) VALUES
  ('EMP-0001', 'EMP-0002', 'manager_employee', '2021-03-20', 'active'),
  ('CLNT-0001', 'CLNT-0002', 'partner', '2022-01-01', 'active')
ON CONFLICT DO NOTHING;

-- ===================================================================
-- SEED DATA: benefits.vendor_link
-- ===================================================================
INSERT INTO benefits.vendor_link (
  vendor_id,
  company_uid,
  vendor_name,
  vendor_type,
  group_number,
  integration_type,
  column_number,
  column_description,
  column_format
) VALUES
  ('VEND-GUARDIAN', 'CLNT-0001', 'Guardian Life', 'Carrier', 'GRP-12345', 'API', 1, 'Guardian dental/vision carrier', 'TEXT'),
  ('VEND-BCBS', 'CLNT-0001', 'Blue Cross Blue Shield', 'Carrier', 'BCBS-67890', 'SFTP', 2, 'BCBS medical carrier', 'TEXT'),
  ('VEND-GUARDIAN', 'CLNT-0002', 'Guardian Life', 'Carrier', 'GRP-54321', 'API', 3, 'Guardian for TechCorp', 'TEXT')
ON CONFLICT (vendor_id) DO NOTHING;

-- ===================================================================
-- SEED DATA: benefits.employee_vendor_id
-- ===================================================================
INSERT INTO benefits.employee_vendor_id (
  vendor_emp_uid,
  employee_uid,
  vendor_id,
  vendor_employee_id,
  status,
  column_number,
  column_description,
  column_format
) VALUES
  ('VEMPID-0001', 'EMP-0001', 'VEND-GUARDIAN', 'GRD-EMP-1001', 'active', 1, 'John Smith Guardian ID', 'TEXT'),
  ('VEMPID-0002', 'EMP-0001', 'VEND-BCBS', 'BCBS-EMP-2001', 'active', 2, 'John Smith BCBS ID', 'TEXT'),
  ('VEMPID-0003', 'EMP-0002', 'VEND-GUARDIAN', 'GRD-EMP-1002', 'active', 3, 'Jane Doe Guardian ID', 'TEXT'),
  ('VEMPID-0004', 'EMP-0003', 'VEND-GUARDIAN', 'GRD-EMP-5001', 'active', 4, 'Bob Johnson Guardian ID', 'TEXT')
ON CONFLICT (vendor_emp_uid) DO NOTHING;

-- ===================================================================
-- SEED DATA: compliance.compliance_vault
-- ===================================================================
INSERT INTO compliance.compliance_vault (
  compliance_id,
  company_uid,
  self_insured,
  erisa_applicable,
  aca_applicable,
  fmla_state_rules,
  plan_year_start,
  plan_year_end,
  required_forms,
  column_number,
  column_description,
  column_format
) VALUES
  (
    'COMP-0001',
    'CLNT-0001',
    TRUE,
    TRUE,
    TRUE,
    '{"state": "CA", "enhanced_leave": true, "weeks_available": 12}'::jsonb,
    '2025-01-01',
    '2025-12-31',
    '["Form 5500", "1095-C", "Summary Plan Description"]'::jsonb,
    1,
    'Acme Benefits compliance record',
    'TEXT'
  ),
  (
    'COMP-0002',
    'CLNT-0002',
    FALSE,
    TRUE,
    TRUE,
    '{"state": "NY", "enhanced_leave": false, "weeks_available": 12}'::jsonb,
    '2025-01-01',
    '2025-12-31',
    '["Form 5500", "1095-C"]'::jsonb,
    2,
    'TechCorp compliance record',
    'TEXT'
  )
ON CONFLICT (compliance_id) DO NOTHING;

-- ===================================================================
-- SEED DATA: operations.audit_data_lineage
-- ===================================================================
INSERT INTO operations.audit_data_lineage (
  entity_uid,
  attribute_code,
  attribute_value,
  action_type,
  version_hash,
  filled_by,
  column_number,
  column_description,
  column_format
) VALUES
  ('CLNT-0001', 'company_name', 'Acme Benefits LLC', 'CREATE', 'abc123def456', 'SYSTEM-SEED', 1, 'Company creation audit', 'TEXT'),
  ('EMP-0001', 'first_name', 'John', 'CREATE', 'def456ghi789', 'SYSTEM-SEED', 2, 'Employee creation audit', 'TEXT'),
  ('EMP-0001', 'employment_status', 'active', 'UPDATE', 'ghi789jkl012', 'SYSTEM-SEED', 3, 'Employee status update', 'TEXT');

-- ===================================================================
-- SEED DATA: staging.raw_intake_company
-- ===================================================================
INSERT INTO staging.raw_intake_company (
  raw_data,
  source,
  processed,
  column_number,
  column_description,
  column_format
) VALUES
  (
    '{"company_name": "New Company Inc", "ein": "11-2233445", "address": "123 Main St"}'::jsonb,
    'UI',
    FALSE,
    1,
    'Unprocessed company from UI intake',
    'JSONB'
  );

-- ===================================================================
-- SEED DATA: staging.raw_intake_employee
-- ===================================================================
INSERT INTO staging.raw_intake_employee (
  raw_data,
  source,
  processed,
  column_number,
  column_description,
  column_format
) VALUES
  (
    '{"first_name": "Alice", "last_name": "Williams", "hire_date": "2024-01-15", "company_uid": "CLNT-0001"}'::jsonb,
    'UI',
    FALSE,
    1,
    'Unprocessed employee from UI intake',
    'JSONB'
  );

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
-- Run these queries to verify seed data was inserted successfully:

-- SELECT COUNT(*) as company_count FROM core.company_master;
-- SELECT COUNT(*) as employee_count FROM core.employee_master;
-- SELECT COUNT(*) as vendor_count FROM benefits.vendor_link;
-- SELECT COUNT(*) as compliance_count FROM compliance.compliance_vault;
-- SELECT COUNT(*) as audit_count FROM operations.audit_data_lineage;
-- SELECT COUNT(*) as staging_company_count FROM staging.raw_intake_company WHERE processed = FALSE;
-- SELECT COUNT(*) as staging_employee_count FROM staging.raw_intake_employee WHERE processed = FALSE;
