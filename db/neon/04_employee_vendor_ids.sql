-- Migration 04: Employee Vendor ID Tracking Table
-- Purpose: Track cross-vendor IDs for each employee to maintain vendor relationships
-- Created: 2025-10-20

-- Create employee_vendor_ids table in clnt schema
CREATE TABLE IF NOT EXISTS clnt.employee_vendor_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  vendor_code TEXT NOT NULL,
  vendor_employee_id TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  validated BOOLEAN DEFAULT FALSE,
  timestamp_last_touched TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),

  -- Ensure unique vendor ID per employee per vendor
  CONSTRAINT unique_employee_vendor UNIQUE (employee_id, vendor_code),

  -- Ensure effective_date is before termination_date
  CONSTRAINT valid_date_range CHECK (termination_date IS NULL OR effective_date <= termination_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_vendor_ids_company
  ON clnt.employee_vendor_ids(company_id);

CREATE INDEX IF NOT EXISTS idx_employee_vendor_ids_employee
  ON clnt.employee_vendor_ids(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_vendor_ids_vendor
  ON clnt.employee_vendor_ids(vendor_code);

CREATE INDEX IF NOT EXISTS idx_employee_vendor_ids_validated
  ON clnt.employee_vendor_ids(validated);

CREATE INDEX IF NOT EXISTS idx_employee_vendor_ids_effective_date
  ON clnt.employee_vendor_ids(effective_date);

-- Add comments for documentation
COMMENT ON TABLE clnt.employee_vendor_ids IS
  'Tracks vendor-specific employee IDs across multiple benefit vendors for cross-reference and mapping';

COMMENT ON COLUMN clnt.employee_vendor_ids.vendor_code IS
  'Vendor identifier (e.g., mutual_of_omaha, guardian_life)';

COMMENT ON COLUMN clnt.employee_vendor_ids.vendor_employee_id IS
  'Vendor-assigned employee ID';

COMMENT ON COLUMN clnt.employee_vendor_ids.validated IS
  'Indicates if the vendor ID has been validated with the vendor system';

COMMENT ON COLUMN clnt.employee_vendor_ids.timestamp_last_touched IS
  'ISO timestamp of last modification for audit tracking';
