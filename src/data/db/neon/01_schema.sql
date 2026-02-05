-- ===================================================================
-- Schema: clnt (Client Sub-Hive)
-- Vault layer for company, employee, vendor, benefit, enrollment
-- ===================================================================

CREATE SCHEMA IF NOT EXISTS clnt;

-- Master Companies
CREATE TABLE clnt.company_master (
    company_unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    ein TEXT UNIQUE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Employees
CREATE TABLE clnt.employee_master (
    employee_unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_unique_id UUID NOT NULL REFERENCES clnt.company_master(company_unique_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    ssn_last4 CHAR(4),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vendors
CREATE TABLE clnt.vendor_master (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL,
    vendor_type TEXT,
    default_support_email TEXT,
    default_support_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Company ↔ Vendor Link (SPD + Contacts)
CREATE TABLE clnt.company_vendor_link (
    company_vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_unique_id UUID NOT NULL REFERENCES clnt.company_master(company_unique_id),
    vendor_id UUID NOT NULL REFERENCES clnt.vendor_master(vendor_id),
    account_manager_name TEXT,
    account_manager_email TEXT,
    account_manager_phone TEXT,
    support_email TEXT,
    support_phone TEXT,
    spd_url TEXT,
    renewal_date DATE,
    blueprint_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Benefits
CREATE TABLE clnt.benefit_master (
    benefit_unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_vendor_id UUID NOT NULL REFERENCES clnt.company_vendor_link(company_vendor_id),
    vendor_benefit_id TEXT NOT NULL,
    benefit_type TEXT NOT NULL,
    effective_date DATE,
    renewal_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Benefit Tier Costs
CREATE TABLE clnt.benefit_tier_cost (
    tier_cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benefit_unique_id UUID NOT NULL REFERENCES clnt.benefit_master(benefit_unique_id),
    tier_type TEXT CHECK (tier_type IN ('employee_only', 'employee_spouse', 'employee_children', 'family')),
    plan_year INT NOT NULL,
    cost_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Employee Enrollment
CREATE TABLE clnt.employee_benefit_enrollment (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_unique_id UUID NOT NULL REFERENCES clnt.employee_master(employee_unique_id),
    benefit_unique_id UUID NOT NULL REFERENCES clnt.benefit_master(benefit_unique_id),
    tier_type TEXT CHECK (tier_type IN ('employee_only', 'employee_spouse', 'employee_children', 'family')),
    effective_date DATE,
    termination_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Output Blueprints
CREATE TABLE clnt.vendor_output_blueprint (
    blueprint_id TEXT PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES clnt.vendor_master(vendor_id),
    mapping_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);