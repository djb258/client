-- 02_views.sql
-- Convenience views for client-subhive

CREATE OR REPLACE VIEW clnt.v_company_summary AS
SELECT
  c.company_id,
  c.company_name,
  c.ein,
  c.internal_group_number,
  COUNT(DISTINCT e.employee_id) AS employee_count,
  COUNT(DISTINCT vl.vendor_name) AS vendor_count,
  COUNT(DISTINCT b.benefit_id) AS benefit_count,
  c.validated,
  c.created_at
FROM clnt.company c
LEFT JOIN clnt.employee e ON c.company_id = e.company_id
LEFT JOIN clnt.vendor_linkage vl ON c.company_id = vl.company_id AND vl.active = true
LEFT JOIN clnt.benefits b ON c.company_id = b.company_id
GROUP BY c.company_id;

CREATE OR REPLACE VIEW clnt.v_employee_enrollments AS
SELECT
  e.employee_id,
  e.first_name,
  e.last_name,
  e.internal_employee_number,
  c.company_name,
  en.enrollment_id,
  b.benefit_type,
  b.benefit_description,
  t.tier_name,
  en.enrollment_date,
  en.status
FROM clnt.employee e
JOIN clnt.company c ON e.company_id = c.company_id
LEFT JOIN clnt.enrollments en ON e.employee_id = en.employee_id
LEFT JOIN clnt.benefits b ON en.benefit_id = b.benefit_id
LEFT JOIN clnt.tiers t ON en.tier_id = t.tier_id;

CREATE OR REPLACE VIEW clnt.v_vendor_linkage_summary AS
SELECT
  vl.linkage_id,
  c.company_name,
  vl.vendor_name,
  vl.vendor_group_number,
  vl.active,
  vl.created_at
FROM clnt.vendor_linkage vl
JOIN clnt.company c ON vl.company_id = c.company_id;