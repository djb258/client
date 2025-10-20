-- Migration 05: Audit Logging Table
-- Purpose: Track all validator and agent actions for compliance and debugging
-- Created: 2025-10-20

-- Create audit_log table in shq schema
CREATE TABLE IF NOT EXISTS shq.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT,
  agent_id TEXT NOT NULL,
  process_type TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMP DEFAULT now(),

  -- Ensure valid status values
  CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'pending', 'warning'))
);

-- Create indexes for performance and querying
CREATE INDEX IF NOT EXISTS idx_audit_log_company
  ON shq.audit_log(company_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_agent
  ON shq.audit_log(agent_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_process
  ON shq.audit_log(process_type);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON shq.audit_log(action);

CREATE INDEX IF NOT EXISTS idx_audit_log_status
  ON shq.audit_log(status);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
  ON shq.audit_log(timestamp DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_company_timestamp
  ON shq.audit_log(company_id, timestamp DESC);

-- Create GIN index for JSONB details column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_audit_log_details
  ON shq.audit_log USING GIN (details);

-- Add comments for documentation
COMMENT ON TABLE shq.audit_log IS
  'Comprehensive audit log tracking all validator and agent actions across the system';

COMMENT ON COLUMN shq.audit_log.agent_id IS
  'Identifier for the agent or validator that performed the action (e.g., SHQ-INTAKE-VALIDATOR, COMPLIANCE-CHECKER)';

COMMENT ON COLUMN shq.audit_log.process_type IS
  'Type of process executed (e.g., intake_validation, blueprint_tagging, vendor_export, compliance_check)';

COMMENT ON COLUMN shq.audit_log.action IS
  'Specific action taken (e.g., validate, promote, export, check_compliance)';

COMMENT ON COLUMN shq.audit_log.status IS
  'Result status of the action: success, failure, pending, or warning';

COMMENT ON COLUMN shq.audit_log.details IS
  'JSON object containing additional context, metadata, and structured information about the action';

COMMENT ON COLUMN shq.audit_log.duration_ms IS
  'Duration of the action in milliseconds for performance monitoring';

-- Create view for recent audit entries
CREATE OR REPLACE VIEW shq.audit_log_recent AS
SELECT
  id,
  company_id,
  agent_id,
  process_type,
  action,
  status,
  details,
  error_message,
  duration_ms,
  timestamp,
  timestamp::date as audit_date
FROM shq.audit_log
WHERE timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

COMMENT ON VIEW shq.audit_log_recent IS
  'View of audit log entries from the last 7 days for quick access to recent activity';
