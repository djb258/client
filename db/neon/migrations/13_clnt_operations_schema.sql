-- ===================================================================
-- Migration: 13_clnt_operations_schema.sql
-- Database: clnt
-- Schema: operations (Audit + Tickets)
-- Purpose: Data lineage tracking and operational audit trails
-- Created: 2025-10-27
-- ===================================================================
-- PREREQUISITE: Connect to the 'clnt' database before running this migration
-- ===================================================================

-- Create the operations schema within the clnt database
CREATE SCHEMA IF NOT EXISTS operations;

-- ===================================================================
-- TABLE: operations.audit_data_lineage
-- Purpose: Track data modifications and lineage for audit trails
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS operations.audit_data_lineage (
  lineage_id SERIAL PRIMARY KEY,
  entity_uid TEXT NOT NULL,
  attribute_code TEXT NOT NULL,
  attribute_value TEXT,
  action_type TEXT NOT NULL,
  version_hash TEXT,
  timestamp_used TIMESTAMP DEFAULT NOW(),
  filled_by TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster audit queries
CREATE INDEX IF NOT EXISTS idx_audit_entity ON operations.audit_data_lineage(entity_uid);
CREATE INDEX IF NOT EXISTS idx_audit_attribute ON operations.audit_data_lineage(attribute_code);
CREATE INDEX IF NOT EXISTS idx_audit_action ON operations.audit_data_lineage(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON operations.audit_data_lineage(timestamp_used);
CREATE INDEX IF NOT EXISTS idx_audit_filled_by ON operations.audit_data_lineage(filled_by);

COMMENT ON TABLE operations.audit_data_lineage IS 'Data lineage and audit trail tracking with doctrine metadata compliance';
COMMENT ON COLUMN operations.audit_data_lineage.lineage_id IS 'Auto-incrementing lineage record identifier';
COMMENT ON COLUMN operations.audit_data_lineage.entity_uid IS 'Entity identifier (company_uid, employee_uid, etc.)';
COMMENT ON COLUMN operations.audit_data_lineage.attribute_code IS 'Attribute/field name that was modified';
COMMENT ON COLUMN operations.audit_data_lineage.attribute_value IS 'Value of the attribute at this version';
COMMENT ON COLUMN operations.audit_data_lineage.action_type IS 'Action type: CREATE, UPDATE, DELETE, EXPORT, IMPORT';
COMMENT ON COLUMN operations.audit_data_lineage.version_hash IS 'Hash of the record version for integrity verification';
COMMENT ON COLUMN operations.audit_data_lineage.timestamp_used IS 'When this version was active/used';
COMMENT ON COLUMN operations.audit_data_lineage.filled_by IS 'User, agent, or system that performed the action';
COMMENT ON COLUMN operations.audit_data_lineage.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN operations.audit_data_lineage.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN operations.audit_data_lineage.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ===================================================================
CREATE TRIGGER update_audit_data_lineage_updated_at
    BEFORE UPDATE ON operations.audit_data_lineage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
