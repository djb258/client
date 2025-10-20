-- Migration 06: Centralized Error Log Table
-- Purpose: Centralize all agent and validator error handling for monitoring and resolution
-- Created: 2025-10-20

-- Create error_log table in shq schema
CREATE TABLE IF NOT EXISTS shq.error_log (
  error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT,
  process_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  timestamp_created TIMESTAMPTZ DEFAULT now(),

  -- Ensure resolved_at is set when resolved is true
  CONSTRAINT resolved_timestamp_check CHECK (
    (resolved = FALSE AND resolved_at IS NULL) OR
    (resolved = TRUE AND resolved_at IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_log_agent
  ON shq.error_log(agent_id);

CREATE INDEX IF NOT EXISTS idx_error_log_process
  ON shq.error_log(process_id);

CREATE INDEX IF NOT EXISTS idx_error_log_resolved
  ON shq.error_log(resolved);

CREATE INDEX IF NOT EXISTS idx_error_log_timestamp
  ON shq.error_log(timestamp_created DESC);

CREATE INDEX IF NOT EXISTS idx_error_log_error_type
  ON shq.error_log(error_type);

-- Create GIN index for JSONB details column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_error_log_details
  ON shq.error_log USING GIN (details);

-- Create composite index for common queries (unresolved errors by agent)
CREATE INDEX IF NOT EXISTS idx_error_log_agent_resolved
  ON shq.error_log(agent_id, resolved, timestamp_created DESC);

-- Create composite index for unresolved errors by timestamp
CREATE INDEX IF NOT EXISTS idx_error_log_unresolved_timestamp
  ON shq.error_log(timestamp_created DESC)
  WHERE resolved = FALSE;

-- Add comments for documentation
COMMENT ON TABLE shq.error_log IS
  'Centralized error log for all agent and validator errors across the system';

COMMENT ON COLUMN shq.error_log.error_id IS
  'Unique identifier for each error entry';

COMMENT ON COLUMN shq.error_log.agent_id IS
  'Identifier for the agent or validator that encountered the error (e.g., SHQ-INTAKE-VALIDATOR, VENDOR-EXPORT-AGENT)';

COMMENT ON COLUMN shq.error_log.process_id IS
  'Identifier for the specific process or job that encountered the error (e.g., job_id, company_id)';

COMMENT ON COLUMN shq.error_log.error_type IS
  'Category of error (e.g., SCHEMA_VALIDATION_FAILED, DATABASE_CONNECTION_ERROR, MAPPING_ERROR)';

COMMENT ON COLUMN shq.error_log.error_message IS
  'Human-readable error message describing what went wrong';

COMMENT ON COLUMN shq.error_log.details IS
  'JSON object containing additional context, stack traces, and structured error information';

COMMENT ON COLUMN shq.error_log.resolved IS
  'Indicates whether the error has been addressed and resolved';

COMMENT ON COLUMN shq.error_log.resolved_at IS
  'Timestamp when the error was marked as resolved';

COMMENT ON COLUMN shq.error_log.resolved_by IS
  'Agent ID or user who resolved the error';

COMMENT ON COLUMN shq.error_log.resolution_notes IS
  'Notes describing how the error was resolved';

COMMENT ON COLUMN shq.error_log.timestamp_created IS
  'Timestamp when the error was first logged';

-- Create view for unresolved errors
CREATE OR REPLACE VIEW shq.error_log_unresolved AS
SELECT
  error_id,
  agent_id,
  process_id,
  error_type,
  error_message,
  details,
  timestamp_created,
  EXTRACT(EPOCH FROM (NOW() - timestamp_created)) / 3600 AS hours_unresolved
FROM shq.error_log
WHERE resolved = FALSE
ORDER BY timestamp_created DESC;

COMMENT ON VIEW shq.error_log_unresolved IS
  'View of all unresolved errors with calculated hours since occurrence';

-- Create view for error summary by agent
CREATE OR REPLACE VIEW shq.error_log_summary_by_agent AS
SELECT
  agent_id,
  error_type,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_count,
  COUNT(*) FILTER (WHERE resolved = FALSE) as unresolved_count,
  MAX(timestamp_created) as last_error_at,
  AVG(EXTRACT(EPOCH FROM (resolved_at - timestamp_created)) / 3600)
    FILTER (WHERE resolved = TRUE) as avg_resolution_hours
FROM shq.error_log
WHERE timestamp_created >= NOW() - INTERVAL '30 days'
GROUP BY agent_id, error_type
ORDER BY unresolved_count DESC, total_errors DESC;

COMMENT ON VIEW shq.error_log_summary_by_agent IS
  'Summary of errors by agent and type over the last 30 days with resolution metrics';

-- Create view for recent critical errors
CREATE OR REPLACE VIEW shq.error_log_critical AS
SELECT
  error_id,
  agent_id,
  process_id,
  error_type,
  error_message,
  details,
  resolved,
  timestamp_created
FROM shq.error_log
WHERE error_type IN (
    'DATABASE_CONNECTION_ERROR',
    'SYSTEM_FAILURE',
    'DATA_CORRUPTION',
    'SECURITY_VIOLATION',
    'CRITICAL_VALIDATION_FAILURE'
  )
  AND timestamp_created >= NOW() - INTERVAL '7 days'
ORDER BY timestamp_created DESC;

COMMENT ON VIEW shq.error_log_critical IS
  'View of critical errors from the last 7 days requiring immediate attention';

-- Create function to mark error as resolved
CREATE OR REPLACE FUNCTION shq.resolve_error(
  p_error_id UUID,
  p_resolved_by TEXT,
  p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE shq.error_log
  SET
    resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes
  WHERE error_id = p_error_id
    AND resolved = FALSE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION shq.resolve_error IS
  'Mark an error as resolved with resolver information and optional notes';

-- Create function to log error
CREATE OR REPLACE FUNCTION shq.log_error(
  p_agent_id TEXT,
  p_process_id TEXT,
  p_error_type TEXT,
  p_error_message TEXT,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO shq.error_log (
    agent_id,
    process_id,
    error_type,
    error_message,
    details
  ) VALUES (
    p_agent_id,
    p_process_id,
    p_error_type,
    p_error_message,
    p_details
  ) RETURNING error_id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION shq.log_error IS
  'Convenience function to log an error and return the error_id';
