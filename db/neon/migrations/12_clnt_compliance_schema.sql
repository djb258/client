-- ===================================================================
-- Migration: 12_clnt_compliance_schema.sql
-- Database: clnt
-- Schema: compliance (Rules + State/Federal Layer)
-- Purpose: Compliance rules, regulations, and requirements tracking
-- Created: 2025-10-27
-- ===================================================================
-- PREREQUISITE: Connect to the 'clnt' database before running this migration
-- ===================================================================

-- Create the compliance schema within the clnt database
CREATE SCHEMA IF NOT EXISTS compliance;

-- ===================================================================
-- TABLE: compliance.compliance_vault
-- Purpose: Store compliance rules and regulatory requirements per company
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS compliance.compliance_vault (
  compliance_id TEXT PRIMARY KEY,
  company_uid TEXT NOT NULL REFERENCES core.company_master(company_uid) ON DELETE CASCADE,
  self_insured BOOLEAN DEFAULT FALSE,
  erisa_applicable BOOLEAN DEFAULT TRUE,
  aca_applicable BOOLEAN DEFAULT TRUE,
  fmla_state_rules JSONB,
  plan_year_start DATE,
  plan_year_end DATE,
  required_forms JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster compliance lookups
CREATE INDEX IF NOT EXISTS idx_compliance_company ON compliance.compliance_vault(company_uid);
CREATE INDEX IF NOT EXISTS idx_compliance_erisa ON compliance.compliance_vault(erisa_applicable);
CREATE INDEX IF NOT EXISTS idx_compliance_aca ON compliance.compliance_vault(aca_applicable);
CREATE INDEX IF NOT EXISTS idx_compliance_plan_year ON compliance.compliance_vault(plan_year_start, plan_year_end);

COMMENT ON TABLE compliance.compliance_vault IS 'Compliance rules and regulatory requirements vault with doctrine metadata compliance';
COMMENT ON COLUMN compliance.compliance_vault.compliance_id IS 'Unique compliance record identifier (e.g., COMP-0001)';
COMMENT ON COLUMN compliance.compliance_vault.company_uid IS 'Reference to parent company';
COMMENT ON COLUMN compliance.compliance_vault.self_insured IS 'Whether company is self-insured';
COMMENT ON COLUMN compliance.compliance_vault.erisa_applicable IS 'Whether ERISA regulations apply';
COMMENT ON COLUMN compliance.compliance_vault.aca_applicable IS 'Whether Affordable Care Act applies';
COMMENT ON COLUMN compliance.compliance_vault.fmla_state_rules IS 'JSONB: State-specific FMLA rules and variations';
COMMENT ON COLUMN compliance.compliance_vault.plan_year_start IS 'Plan year start date';
COMMENT ON COLUMN compliance.compliance_vault.plan_year_end IS 'Plan year end date';
COMMENT ON COLUMN compliance.compliance_vault.required_forms IS 'JSONB: List of required compliance forms (5500, 1095-C, etc.)';
COMMENT ON COLUMN compliance.compliance_vault.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN compliance.compliance_vault.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN compliance.compliance_vault.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ===================================================================
CREATE TRIGGER update_compliance_vault_updated_at
    BEFORE UPDATE ON compliance.compliance_vault
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
