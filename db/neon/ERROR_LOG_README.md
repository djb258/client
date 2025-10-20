# Error Log System

## Overview

The `shq.error_log` table provides centralized error tracking for all agents and validators in the Client SubHive system.

---

## Database Schema

**Location**: `db/neon/06_error_log.sql`

**Table**: `shq.error_log`

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `error_id` | UUID | Primary key, auto-generated |
| `agent_id` | TEXT | Agent/validator identifier (e.g., "SHQ-INTAKE-VALIDATOR") |
| `process_id` | TEXT | Process/job identifier (company_id, job_id, etc.) |
| `error_type` | TEXT | Error category (see Error Types below) |
| `error_message` | TEXT | Human-readable error description |
| `details` | JSONB | Structured error context (stack traces, input data, etc.) |
| `resolved` | BOOLEAN | Whether the error has been fixed |
| `resolved_at` | TIMESTAMPTZ | When the error was marked as resolved |
| `resolved_by` | TEXT | Agent/user who resolved the error |
| `resolution_notes` | TEXT | Description of how error was fixed |
| `timestamp_created` | TIMESTAMPTZ | When the error was first logged |

### Indexes

- `idx_error_log_agent` - Query by agent_id
- `idx_error_log_process` - Query by process_id
- `idx_error_log_resolved` - Filter by resolved status
- `idx_error_log_timestamp` - Sort by timestamp (DESC)
- `idx_error_log_error_type` - Filter by error type
- `idx_error_log_details` - GIN index for JSONB queries
- `idx_error_log_agent_resolved` - Composite index for common queries
- `idx_error_log_unresolved_timestamp` - Partial index for unresolved errors

---

## Error Types

Use the standardized error types from `scripts/error-logger.ts`:

### Validation Errors
- `SCHEMA_VALIDATION_FAILED` - Schema/type validation errors
- `BUSINESS_RULE_VIOLATION` - Business rule violations
- `DUPLICATE_ENTRY` - Duplicate record detected
- `INVALID_FORMAT` - Invalid data format (EIN, dates, etc.)
- `MISSING_REQUIRED_FIELD` - Required field not provided

### Database Errors
- `DATABASE_CONNECTION_ERROR` - Cannot connect to database
- `QUERY_EXECUTION_ERROR` - SQL query failed
- `TRANSACTION_FAILED` - Database transaction failed
- `DATA_CORRUPTION` - Data integrity issue detected

### Network Errors
- `API_REQUEST_FAILED` - External API call failed
- `TIMEOUT_ERROR` - Request timed out
- `NETWORK_UNREACHABLE` - Network connectivity issue

### Transformation Errors
- `MAPPING_ERROR` - Blueprint mapping error
- `TRANSFORMATION_FAILED` - Data transformation failed
- `BLUEPRINT_NOT_FOUND` - Blueprint not found in database

### System Errors
- `SYSTEM_FAILURE` - System-wide failure
- `CONFIGURATION_ERROR` - Configuration issue
- `PERMISSION_DENIED` - Permission error
- `SECURITY_VIOLATION` - Security policy violation

### Agent Errors
- `AGENT_EXECUTION_FAILED` - Agent execution failed
- `DELEGATION_FAILED` - Subagent delegation failed
- `HEIR_COORDINATION_ERROR` - HEIR coordination error

### Export Errors
- `VENDOR_EXPORT_FAILED` - Vendor export failed
- `VENDOR_ID_MISSING` - Vendor employee ID not found

### Critical Errors
- `CRITICAL_VALIDATION_FAILURE` - Critical validation failure requiring immediate attention

---

## Usage

### TypeScript Error Logging

```typescript
import { logAgentError, ErrorTypes, resolveError } from './scripts/error-logger';

// Log an error
try {
  await validateCompany(companyData);
} catch (err) {
  const errorId = await logAgentError(
    'SHQ-INTAKE-VALIDATOR',
    companyData.company_id,
    ErrorTypes.SCHEMA_VALIDATION_FAILED,
    'Company EIN format invalid',
    {
      field: 'ein',
      expected: 'XX-XXXXXXX',
      received: companyData.ein,
      stack: err.stack
    }
  );

  console.error(`Error logged with ID: ${errorId}`);
  throw err;
}

// Resolve an error
await resolveError({
  error_id: errorId,
  resolved_by: 'SHQ-INTAKE-VALIDATOR',
  resolution_notes: 'Fixed by updating EIN format validation rules'
});
```

### Direct SQL Functions

```sql
-- Log an error
SELECT shq.log_error(
  'SHQ-INTAKE-VALIDATOR',
  'company-uuid-123',
  'SCHEMA_VALIDATION_FAILED',
  'Company EIN format invalid',
  '{"field": "ein", "expected": "XX-XXXXXXX", "received": "12345678"}'::jsonb
);

-- Resolve an error
SELECT shq.resolve_error(
  'error-uuid-123',
  'SHQ-INTAKE-VALIDATOR',
  'Fixed by updating EIN format validation rules'
);
```

---

## Views

### `shq.error_log_unresolved`

Shows all unresolved errors with calculated hours since occurrence.

```sql
SELECT * FROM shq.error_log_unresolved
LIMIT 50;
```

**Columns**: `error_id`, `agent_id`, `process_id`, `error_type`, `error_message`, `details`, `timestamp_created`, `hours_unresolved`

### `shq.error_log_summary_by_agent`

Summary of errors by agent and type over the last 30 days with resolution metrics.

```sql
SELECT * FROM shq.error_log_summary_by_agent;
```

**Columns**: `agent_id`, `error_type`, `total_errors`, `resolved_count`, `unresolved_count`, `last_error_at`, `avg_resolution_hours`

### `shq.error_log_critical`

Critical errors from the last 7 days requiring immediate attention.

```sql
SELECT * FROM shq.error_log_critical;
```

Includes errors of types: `DATABASE_CONNECTION_ERROR`, `SYSTEM_FAILURE`, `DATA_CORRUPTION`, `SECURITY_VIOLATION`, `CRITICAL_VALIDATION_FAILURE`

---

## CLI Commands

Check error logs using npm scripts:

```bash
# Check unresolved errors (default)
npm run errors:check

# Show unresolved errors
npm run errors:unresolved

# Show critical errors
npm run errors:critical

# Show error summary by agent
npm run errors:summary

# Show recent errors (last 24 hours)
npm run errors:recent
```

---

## Querying Error Logs

### Get Unresolved Errors

```typescript
import { getUnresolvedErrors } from './scripts/error-logger';

const errors = await getUnresolvedErrors(50);
errors.forEach(err => {
  console.log(`[${err.error_type}] ${err.error_message}`);
});
```

### Get Critical Errors

```typescript
import { getCriticalErrors } from './scripts/error-logger';

const critical = await getCriticalErrors();
```

### Query with Filters

```typescript
import { queryErrors } from './scripts/error-logger';

// Get errors from specific agent
const agentErrors = await queryErrors({
  agent_id: 'SHQ-INTAKE-VALIDATOR',
  resolved: false,
  limit: 100
});

// Get errors from last 24 hours
const since = new Date();
since.setHours(since.getHours() - 24);

const recentErrors = await queryErrors({ since });

// Get specific error type
const validationErrors = await queryErrors({
  error_type: 'SCHEMA_VALIDATION_FAILED',
  resolved: false
});
```

### Get Error Summary

```typescript
import { getErrorSummaryByAgent } from './scripts/error-logger';

const summary = await getErrorSummaryByAgent();
summary.forEach(item => {
  console.log(`${item.agent_id}: ${item.total_errors} errors, ${item.unresolved_count} unresolved`);
});
```

---

## SQL Query Examples

### Recent Unresolved Errors

```sql
SELECT
  error_type,
  error_message,
  agent_id,
  process_id,
  timestamp_created
FROM shq.error_log
WHERE resolved = FALSE
  AND timestamp_created >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp_created DESC;
```

### Error Count by Type

```sql
SELECT
  error_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved,
  COUNT(*) FILTER (WHERE resolved = FALSE) as unresolved
FROM shq.error_log
WHERE timestamp_created >= NOW() - INTERVAL '7 days'
GROUP BY error_type
ORDER BY total DESC;
```

### Agent Error Rate

```sql
SELECT
  agent_id,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE resolved = TRUE) / COUNT(*), 2) as resolution_rate_pct
FROM shq.error_log
WHERE timestamp_created >= NOW() - INTERVAL '30 days'
GROUP BY agent_id
ORDER BY total_errors DESC;
```

### Errors by Process

```sql
SELECT
  process_id,
  COUNT(*) as error_count,
  ARRAY_AGG(DISTINCT error_type) as error_types
FROM shq.error_log
WHERE timestamp_created >= NOW() - INTERVAL '7 days'
GROUP BY process_id
HAVING COUNT(*) > 1
ORDER BY error_count DESC;
```

### Resolution Time Analysis

```sql
SELECT
  agent_id,
  error_type,
  COUNT(*) as resolved_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - timestamp_created)) / 3600) as avg_hours_to_resolve,
  MIN(EXTRACT(EPOCH FROM (resolved_at - timestamp_created)) / 3600) as min_hours,
  MAX(EXTRACT(EPOCH FROM (resolved_at - timestamp_created)) / 3600) as max_hours
FROM shq.error_log
WHERE resolved = TRUE
  AND timestamp_created >= NOW() - INTERVAL '30 days'
GROUP BY agent_id, error_type
ORDER BY avg_hours_to_resolve DESC;
```

---

## Best Practices

### For Agents

1. **Always log errors** before throwing or handling
2. **Use standardized error types** from `ErrorTypes` constant
3. **Include context** in the `details` JSONB field
4. **Resolve errors** when fixed with clear resolution notes
5. **Monitor error rates** regularly using views and CLI tools

### For Developers

1. **Check unresolved errors** daily using `npm run errors:unresolved`
2. **Investigate critical errors** immediately using `npm run errors:critical`
3. **Review error summaries** weekly to identify patterns
4. **Document resolutions** in `resolution_notes` for future reference
5. **Use JSONB queries** to analyze error patterns and root causes

### Error Details Best Practices

Include in `details` JSONB:
- Stack traces (`stack`)
- Input data (sanitized, no PII)
- Expected vs received values
- Context variables
- Related IDs (company_id, employee_id, etc.)
- Timestamp of occurrence
- Environment info (if relevant)

Example:
```json
{
  "field": "ein",
  "expected": "XX-XXXXXXX",
  "received": "12345678",
  "company_id": "uuid-123",
  "validation_rule": "EIN_FORMAT",
  "stack": "Error: Invalid EIN format\n  at validateEIN...",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

---

## Integration with Audit Log

**Difference between `shq.error_log` and `shq.audit_log`**:

| Feature | `shq.error_log` | `shq.audit_log` |
|---------|-----------------|-----------------|
| Purpose | Error tracking and resolution | Action tracking and monitoring |
| When to use | When errors occur | For all actions (success or failure) |
| Focus | Problems and fixes | Operations and performance |
| Lifecycle | Created → Resolved | Created (immutable) |
| Metrics | Resolution time, error rates | Success rates, duration |

**Use both**:
- Log action start to `audit_log` (status: 'pending')
- Log errors to `error_log` when they occur
- Log action completion to `audit_log` (status: 'success'/'failure')
- Resolve errors in `error_log` when fixed

---

## Monitoring and Alerts

### Daily Checks

```bash
# Check for unresolved errors
npm run errors:unresolved

# Check for critical errors
npm run errors:critical
```

### Weekly Reviews

```bash
# Review error summary
npm run errors:summary
```

### Alert Triggers

Consider setting up alerts for:
- More than 10 unresolved errors
- Any critical errors
- Error rate increase > 50% week-over-week
- Errors unresolved for > 24 hours
- Same error occurring > 5 times in 1 hour

---

## Related Documentation

- `README_LLM_OVERVIEW.md` - Section 4.4 (Error Log enforcement)
- `README_LLM_OVERVIEW.md` - Section 5.6 (Error logging requirements)
- `scripts/error-logger.ts` - Error logging utility implementation
- `db/neon/05_audit_log.sql` - Audit logging schema (complementary)
