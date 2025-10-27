-- ===================================================================
-- Migration: 14_clnt_staging_schema.sql
-- Database: clnt
-- Schema: staging (Raw Intake)
-- Purpose: Raw data intake tables for unprocessed company and employee data
-- Created: 2025-10-27
-- ===================================================================
-- PREREQUISITE: Connect to the 'clnt' database before running this migration
-- ===================================================================

-- Create the staging schema within the clnt database
CREATE SCHEMA IF NOT EXISTS staging;

-- ===================================================================
-- TABLE: staging.raw_intake_company
-- Purpose: Temporary storage for raw company intake data before processing
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS staging.raw_intake_company (
  intake_id SERIAL PRIMARY KEY,
  raw_data JSONB NOT NULL,
  source TEXT,
  processed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster staging queries
CREATE INDEX IF NOT EXISTS idx_raw_company_processed ON staging.raw_intake_company(processed);
CREATE INDEX IF NOT EXISTS idx_raw_company_source ON staging.raw_intake_company(source);
CREATE INDEX IF NOT EXISTS idx_raw_company_created ON staging.raw_intake_company(created_at);

COMMENT ON TABLE staging.raw_intake_company IS 'Raw company intake data staging table with doctrine metadata compliance';
COMMENT ON COLUMN staging.raw_intake_company.intake_id IS 'Auto-incrementing intake record identifier';
COMMENT ON COLUMN staging.raw_intake_company.raw_data IS 'JSONB: Complete raw company data as received from intake source';
COMMENT ON COLUMN staging.raw_intake_company.source IS 'Data source: UI, API, CSV, Excel, Manual';
COMMENT ON COLUMN staging.raw_intake_company.processed IS 'Whether record has been validated and promoted to core schema';
COMMENT ON COLUMN staging.raw_intake_company.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN staging.raw_intake_company.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN staging.raw_intake_company.column_format IS 'Doctrine: Expected format/pattern for validation';

-- ===================================================================
-- TABLE: staging.raw_intake_employee
-- Purpose: Temporary storage for raw employee intake data before processing
-- Doctrine Columns: column_number, column_description, column_format
-- ===================================================================
CREATE TABLE IF NOT EXISTS staging.raw_intake_employee (
  intake_id SERIAL PRIMARY KEY,
  raw_data JSONB NOT NULL,
  source TEXT,
  processed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Doctrine metadata columns (STAMPED/SPVPET compliance)
  column_number INT,
  column_description TEXT,
  column_format TEXT
);

-- Add indexes for faster staging queries
CREATE INDEX IF NOT EXISTS idx_raw_employee_processed ON staging.raw_intake_employee(processed);
CREATE INDEX IF NOT EXISTS idx_raw_employee_source ON staging.raw_intake_employee(source);
CREATE INDEX IF NOT EXISTS idx_raw_employee_created ON staging.raw_intake_employee(created_at);

COMMENT ON TABLE staging.raw_intake_employee IS 'Raw employee intake data staging table with doctrine metadata compliance';
COMMENT ON COLUMN staging.raw_intake_employee.intake_id IS 'Auto-incrementing intake record identifier';
COMMENT ON COLUMN staging.raw_intake_employee.raw_data IS 'JSONB: Complete raw employee data as received from intake source';
COMMENT ON COLUMN staging.raw_intake_employee.source IS 'Data source: UI, API, CSV, Excel, Manual';
COMMENT ON COLUMN staging.raw_intake_employee.processed IS 'Whether record has been validated and promoted to core schema';
COMMENT ON COLUMN staging.raw_intake_employee.column_number IS 'Doctrine: Column sequence number for ordering';
COMMENT ON COLUMN staging.raw_intake_employee.column_description IS 'Doctrine: Human-readable column description';
COMMENT ON COLUMN staging.raw_intake_employee.column_format IS 'Doctrine: Expected format/pattern for validation';
