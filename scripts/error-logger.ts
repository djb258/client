/**
 * Centralized Error Logger
 *
 * Utility for logging errors to shq.error_log table in Neon
 * Used by all agents and validators for centralized error tracking
 */

import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const MCP_SERVER_URL = process.env.COMPOSIO_SERVER_URL!;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY!;

export interface ErrorLogEntry {
  agent_id: string;
  process_id: string;
  error_type: string;
  error_message: string;
  details?: Record<string, any>;
}

export interface ErrorResolution {
  error_id: string;
  resolved_by: string;
  resolution_notes?: string;
}

export interface ErrorQueryOptions {
  agent_id?: string;
  process_id?: string;
  error_type?: string;
  resolved?: boolean;
  since?: Date;
  limit?: number;
}

/**
 * Log an error to shq.error_log
 *
 * @param entry - Error log entry details
 * @returns error_id of the logged error
 */
export async function logError(entry: ErrorLogEntry): Promise<string> {
  try {
    const res = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({
        query: `SELECT shq.log_error($1, $2, $3, $4, $5)`,
        params: [
          entry.agent_id,
          entry.process_id,
          entry.error_type,
          entry.error_message,
          entry.details ? JSON.stringify(entry.details) : null
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to log error: ${await res.text()}`);
    }

    const result = await res.json();
    const errorId = result.rows[0].log_error;

    console.error(`[ERROR LOGGED] ${entry.error_type} - ${entry.error_message} (ID: ${errorId})`);
    return errorId;
  } catch (err) {
    // Fallback: log to console if database logging fails
    console.error('[ERROR LOGGER FAILURE] Could not log to database:', err);
    console.error('[ORIGINAL ERROR]', entry);
    throw err;
  }
}

/**
 * Mark an error as resolved
 *
 * @param resolution - Resolution details
 * @returns true if error was successfully marked as resolved
 */
export async function resolveError(resolution: ErrorResolution): Promise<boolean> {
  try {
    const res = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({
        query: `SELECT shq.resolve_error($1, $2, $3)`,
        params: [
          resolution.error_id,
          resolution.resolved_by,
          resolution.resolution_notes || null
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to resolve error: ${await res.text()}`);
    }

    const result = await res.json();
    const resolved = result.rows[0].resolve_error;

    if (resolved) {
      console.log(`[ERROR RESOLVED] ${resolution.error_id} by ${resolution.resolved_by}`);
    }

    return resolved;
  } catch (err) {
    console.error('[ERROR RESOLVER FAILURE] Could not update database:', err);
    throw err;
  }
}

/**
 * Query errors from error log
 *
 * @param options - Query filter options
 * @returns Array of error log entries
 */
export async function queryErrors(options: ErrorQueryOptions = {}): Promise<any[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (options.agent_id) {
    conditions.push(`agent_id = $${paramIndex++}`);
    params.push(options.agent_id);
  }

  if (options.process_id) {
    conditions.push(`process_id = $${paramIndex++}`);
    params.push(options.process_id);
  }

  if (options.error_type) {
    conditions.push(`error_type = $${paramIndex++}`);
    params.push(options.error_type);
  }

  if (options.resolved !== undefined) {
    conditions.push(`resolved = $${paramIndex++}`);
    params.push(options.resolved);
  }

  if (options.since) {
    conditions.push(`timestamp_created >= $${paramIndex++}`);
    params.push(options.since.toISOString());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = options.limit ? `LIMIT ${options.limit}` : '';

  const query = `
    SELECT
      error_id,
      agent_id,
      process_id,
      error_type,
      error_message,
      details,
      resolved,
      resolved_at,
      resolved_by,
      resolution_notes,
      timestamp_created
    FROM shq.error_log
    ${whereClause}
    ORDER BY timestamp_created DESC
    ${limitClause}
  `;

  try {
    const res = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({ query, params })
    });

    if (!res.ok) {
      throw new Error(`Failed to query errors: ${await res.text()}`);
    }

    const result = await res.json();
    return result.rows || [];
  } catch (err) {
    console.error('[ERROR QUERY FAILURE] Could not fetch errors:', err);
    throw err;
  }
}

/**
 * Get unresolved errors
 *
 * @param limit - Maximum number of errors to return
 * @returns Array of unresolved error entries
 */
export async function getUnresolvedErrors(limit: number = 100): Promise<any[]> {
  return queryErrors({ resolved: false, limit });
}

/**
 * Get error summary by agent
 *
 * @returns Array of error summaries grouped by agent
 */
export async function getErrorSummaryByAgent(): Promise<any[]> {
  try {
    const res = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({
        query: `SELECT * FROM shq.error_log_summary_by_agent`
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to get error summary: ${await res.text()}`);
    }

    const result = await res.json();
    return result.rows || [];
  } catch (err) {
    console.error('[ERROR SUMMARY FAILURE] Could not fetch summary:', err);
    throw err;
  }
}

/**
 * Get critical errors
 *
 * @returns Array of critical error entries from last 7 days
 */
export async function getCriticalErrors(): Promise<any[]> {
  try {
    const res = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({
        query: `SELECT * FROM shq.error_log_critical`
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to get critical errors: ${await res.text()}`);
    }

    const result = await res.json();
    return result.rows || [];
  } catch (err) {
    console.error('[CRITICAL ERRORS QUERY FAILURE] Could not fetch critical errors:', err);
    throw err;
  }
}

/**
 * Error type constants for consistent categorization
 */
export const ErrorTypes = {
  // Validation Errors
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Database Errors
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  QUERY_EXECUTION_ERROR: 'QUERY_EXECUTION_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  DATA_CORRUPTION: 'DATA_CORRUPTION',

  // Network Errors
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_UNREACHABLE: 'NETWORK_UNREACHABLE',

  // Transformation Errors
  MAPPING_ERROR: 'MAPPING_ERROR',
  TRANSFORMATION_FAILED: 'TRANSFORMATION_FAILED',
  BLUEPRINT_NOT_FOUND: 'BLUEPRINT_NOT_FOUND',

  // System Errors
  SYSTEM_FAILURE: 'SYSTEM_FAILURE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',

  // Agent Errors
  AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
  DELEGATION_FAILED: 'DELEGATION_FAILED',
  HEIR_COORDINATION_ERROR: 'HEIR_COORDINATION_ERROR',

  // Export Errors
  VENDOR_EXPORT_FAILED: 'VENDOR_EXPORT_FAILED',
  VENDOR_ID_MISSING: 'VENDOR_ID_MISSING',

  // Critical Errors
  CRITICAL_VALIDATION_FAILURE: 'CRITICAL_VALIDATION_FAILURE'
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

/**
 * Helper function to create error log entry with type safety
 *
 * @param agentId - Agent identifier
 * @param processId - Process/job identifier
 * @param errorType - Error category
 * @param errorMessage - Human-readable error message
 * @param details - Additional structured error details
 * @returns Promise resolving to error_id
 */
export async function logAgentError(
  agentId: string,
  processId: string,
  errorType: ErrorType,
  errorMessage: string,
  details?: Record<string, any>
): Promise<string> {
  return logError({
    agent_id: agentId,
    process_id: processId,
    error_type: errorType,
    error_message: errorMessage,
    details
  });
}

// Example usage:
//
// try {
//   await validateCompany(companyData);
// } catch (err) {
//   await logAgentError(
//     'SHQ-INTAKE-VALIDATOR',
//     companyData.company_id,
//     ErrorTypes.SCHEMA_VALIDATION_FAILED,
//     'Company EIN format invalid',
//     {
//       field: 'ein',
//       expected: 'XX-XXXXXXX',
//       received: companyData.ein,
//       error_stack: err.stack
//     }
//   );
//   throw err;
// }
