-- ===================================================================
-- Migration: 10_clnt_core_schema.sql
-- Database: clnt
-- Schema: core (Identity Backbone)
-- Purpose: Core identity and relationship tables for companies and employees
-- Created: 2025-10-27
-- ===================================================================
-- PREREQUISITE: Connect to the 'clnt' database before running this migration
-- ===================================================================

-- Create the core schema within the clnt database
CREATE SCHEMA IF NOT EXISTS core;

-- ===================================================================
-- TABLE: core.company_master
-- Purpose: Master company identity table
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS core.company_master (
  company_uid TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  ein TEXT,
  status TEXT DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster company lookups
CREATE INDEX IF NOT EXISTS idx_company_status ON core.company_master(status);
CREATE INDEX IF NOT EXISTS idx_company_ein ON core.company_master(ein);

COMMENT ON TABLE core.company_master IS 'Master company identity table with doctrine metadata compliance';
COMMENT ON COLUMN core.company_master.company_uid IS 'Unique company identifier (e.g., CLNT-0001)';
COMMENT ON COLUMN core.company_master.ein IS 'Employer Identification Number';
COMMENT ON COLUMN core.company_master.status IS 'Company status: active, inactive, suspended';
COMMENT ON COLUMN core.company_master.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN core.company_master.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN core.company_master.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TABLE: core.employee_master
-- Purpose: Master employee identity table linked to companies
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS core.employee_master (
  employee_uid TEXT PRIMARY KEY,
  company_uid TEXT NOT NULL REFERENCES core.company_master(company_uid) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  hire_date DATE,
  employment_status TEXT DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster employee lookups
CREATE INDEX IF NOT EXISTS idx_employee_company ON core.employee_master(company_uid);
CREATE INDEX IF NOT EXISTS idx_employee_status ON core.employee_master(employment_status);
CREATE INDEX IF NOT EXISTS idx_employee_hire_date ON core.employee_master(hire_date);

COMMENT ON TABLE core.employee_master IS 'Master employee identity table with doctrine metadata compliance';
COMMENT ON COLUMN core.employee_master.employee_uid IS 'Unique employee identifier (e.g., EMP-0001)';
COMMENT ON COLUMN core.employee_master.company_uid IS 'Reference to parent company';
COMMENT ON COLUMN core.employee_master.employment_status IS 'Employee status: active, terminated, leave, suspended';
COMMENT ON COLUMN core.employee_master.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN core.employee_master.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN core.employee_master.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TABLE: core.entity_relationship
-- Purpose: Track relationships between entities (company-to-company, employee-to-employee, etc.)
-- ===================================================================
CREATE TABLE IF NOT EXISTS core.entity_relationship (
  relationship_id SERIAL PRIMARY KEY,
  from_entity_uid TEXT NOT NULL,
  to_entity_uid TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  effective_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_relationship_from ON core.entity_relationship(from_entity_uid);
CREATE INDEX IF NOT EXISTS idx_relationship_to ON core.entity_relationship(to_entity_uid);
CREATE INDEX IF NOT EXISTS idx_relationship_type ON core.entity_relationship(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationship_status ON core.entity_relationship(status);

COMMENT ON TABLE core.entity_relationship IS 'Entity relationship mapping table for complex organizational structures';
COMMENT ON COLUMN core.entity_relationship.from_entity_uid IS 'Source entity UID (company or employee)';
COMMENT ON COLUMN core.entity_relationship.to_entity_uid IS 'Target entity UID (company or employee)';
COMMENT ON COLUMN core.entity_relationship.relationship_type IS 'Type: parent_subsidiary, manager_employee, partner, etc.';
COMMENT ON COLUMN core.entity_relationship.status IS 'Relationship status: active, inactive, pending';

-- ===================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ===================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_master_updated_at
    BEFORE UPDATE ON core.company_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_master_updated_at
    BEFORE UPDATE ON core.employee_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_relationship_updated_at
    BEFORE UPDATE ON core.entity_relationship
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
