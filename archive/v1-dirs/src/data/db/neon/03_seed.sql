-- 03_seed.sql
-- Sample seed data for development/testing

-- Insert sample company
INSERT INTO clnt.company (company_id, company_name, ein, address, industry, internal_group_number, validated)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', '12-3456789', '123 Main St, Anytown, USA', 'Technology', 'GRP-001', true),
  ('22222222-2222-2222-2222-222222222222', 'Widget Inc', '98-7654321', '456 Oak Ave, Somewhere, USA', 'Manufacturing', 'GRP-002', true)
ON CONFLICT (company_id) DO NOTHING;

-- Insert sample employees
INSERT INTO clnt.employee (employee_id, company_id, first_name, last_name, internal_employee_number, benefit_type, coverage_tier, validated)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'John', 'Doe', 'EMP-001', 'medical', 'employee+spouse', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Jane', 'Smith', 'EMP-002', 'dental', 'family', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Bob', 'Johnson', 'EMP-003', 'medical', 'employee', true)
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample vendor linkages
INSERT INTO clnt.vendor_linkage (company_id, vendor_name, vendor_group_number, active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'mutual_of_omaha', 'MOO-12345', true),
  ('11111111-1111-1111-1111-111111111111', 'guardian_life', 'GRD-67890', true),
  ('22222222-2222-2222-2222-222222222222', 'mutual_of_omaha', 'MOO-54321', true)
ON CONFLICT DO NOTHING;

-- Insert sample benefits
INSERT INTO clnt.benefits (benefit_id, company_id, benefit_type, benefit_description, effective_date)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'medical', 'Medical Insurance Plan A', '2025-01-01'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'dental', 'Dental Insurance Plan B', '2025-01-01')
ON CONFLICT (benefit_id) DO NOTHING;

-- Insert sample tiers
INSERT INTO clnt.tiers (tier_id, benefit_id, tier_name)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'employee'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'employee+spouse'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'family')
ON CONFLICT (tier_id) DO NOTHING;

-- Insert sample enrollments
INSERT INTO clnt.enrollments (employee_id, benefit_id, tier_id, enrollment_date, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2025-01-01', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '2025-01-01', 'active')
ON CONFLICT DO NOTHING;