-- ===================================================================
-- Migration: 11_clnt_benefits_schema.sql
-- Database: clnt
-- Schema: benefits (Vendor + Plan References)
-- Purpose: Vendor and employee-vendor ID cross-reference tables
-- Created: 2025-10-27
-- ===================================================================
-- PREREQUISITE: Connect to the 'clnt' database before running this migration
-- ===================================================================

-- Create the benefits schema within the clnt database
CREATE SCHEMA IF NOT EXISTS benefits;

-- ===================================================================
-- TABLE: benefits.vendor_link
-- Purpose: Vendor master table with company linkage
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS benefits.vendor_link (
  vendor_id TEXT PRIMARY KEY,
  company_uid TEXT NOT NULL REFERENCES core.company_master(company_uid) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT,
  group_number TEXT,
  integration_type TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_company ON benefits.vendor_link(company_uid);
CREATE INDEX IF NOT EXISTS idx_vendor_type ON benefits.vendor_link(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendor_name ON benefits.vendor_link(vendor_name);

COMMENT ON TABLE benefits.vendor_link IS 'Vendor master table linked to companies with doctrine metadata compliance';
COMMENT ON COLUMN benefits.vendor_link.vendor_id IS 'Unique vendor identifier (e.g., VEND-GUARDIAN)';
COMMENT ON COLUMN benefits.vendor_link.company_uid IS 'Reference to parent company';
COMMENT ON COLUMN benefits.vendor_link.vendor_type IS 'Vendor type: Carrier, TPA, PBM, Broker, etc.';
COMMENT ON COLUMN benefits.vendor_link.group_number IS 'Company group number with vendor';
COMMENT ON COLUMN benefits.vendor_link.integration_type IS 'Integration type: API, SFTP, Portal, Manual';
COMMENT ON COLUMN benefits.vendor_link.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN benefits.vendor_link.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN benefits.vendor_link.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TABLE: benefits.employee_vendor_id
-- Purpose: Cross-reference table for vendor-specific employee IDs
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS benefits.employee_vendor_id (
  vendor_emp_uid TEXT PRIMARY KEY,
  employee_uid TEXT NOT NULL REFERENCES core.employee_master(employee_uid) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL REFERENCES benefits.vendor_link(vendor_id) ON DELETE CASCADE,
  vendor_employee_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT,

  -- Ensure unique combination of employee and vendor
  CONSTRAINT unique_employee_vendor UNIQUE (employee_uid, vendor_id)
);

-- Add indexes for faster vendor ID lookups
CREATE INDEX IF NOT EXISTS idx_emp_vendor_employee ON benefits.employee_vendor_id(employee_uid);
CREATE INDEX IF NOT EXISTS idx_emp_vendor_vendor ON benefits.employee_vendor_id(vendor_id);
CREATE INDEX IF NOT EXISTS idx_emp_vendor_status ON benefits.employee_vendor_id(status);
CREATE INDEX IF NOT EXISTS idx_emp_vendor_id ON benefits.employee_vendor_id(vendor_employee_id);

COMMENT ON TABLE benefits.employee_vendor_id IS 'Vendor-specific employee ID cross-reference with doctrine metadata compliance';
COMMENT ON COLUMN benefits.employee_vendor_id.vendor_emp_uid IS 'Unique cross-reference identifier';
COMMENT ON COLUMN benefits.employee_vendor_id.employee_uid IS 'Reference to employee in core schema';
COMMENT ON COLUMN benefits.employee_vendor_id.vendor_id IS 'Reference to vendor in benefits schema';
COMMENT ON COLUMN benefits.employee_vendor_id.vendor_employee_id IS 'Vendor-assigned employee ID (varies by vendor)';
COMMENT ON COLUMN benefits.employee_vendor_id.status IS 'Status: active, inactive, pending';
COMMENT ON COLUMN benefits.employee_vendor_id.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN benefits.employee_vendor_id.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN benefits.employee_vendor_id.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ===================================================================
CREATE TRIGGER update_vendor_link_updated_at
    BEFORE UPDATE ON benefits.vendor_link
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_vendor_id_updated_at
    BEFORE UPDATE ON benefits.employee_vendor_id
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
