# Multi-Repo Error Log Integration Guide

## Overview

**All repositories** in the system write to **ONE centralized error log table** in Neon:

```
Database: Neon PostgreSQL
Schema: shq
Table: error_log
```

This is a **shared table** across all repos, agents, and systems. Every error from every repo goes to the same place.

---

## Architecture

```
┌─────────────────┐
│  Client Repo    │────┐
└─────────────────┘    │
                       │
┌─────────────────┐    │
│  IMO Creator    │────┤
└─────────────────┘    │
                       ├──────► Neon: shq.error_log (SINGLE TABLE)
┌─────────────────┐    │
│  Barton Core    │────┤
└─────────────────┘    │
                       │
┌─────────────────┐    │
│  Any Other Repo │────┘
└─────────────────┘
```

---

## Prerequisites for Any Repo

### 1. Neon Database Access

Your repo must have access to the Neon database via environment variable:

```bash
# .env
DATABASE_URL=postgresql://user:password@host/database
# OR
NEON_DATABASE_URL=postgresql://user:password@host/database
```

### 2. MCP Server URL (Optional)

If using Composio MCP gateway:

```bash
COMPOSIO_SERVER_URL=https://your-mcp-server.com
COMPOSIO_API_KEY=your-api-key
```

---

## Integration Steps for Any Repo

### Step 1: Copy the Error Logger Utility

Copy this file from the client repo to your repo:

```bash
# From client repo
cp scripts/error-logger.ts <your-repo>/scripts/error-logger.ts
```

Or create the file manually (see "Standalone Error Logger" section below).

### Step 2: Install Dependencies

```bash
npm install node-fetch dotenv
# OR
yarn add node-fetch dotenv
```

TypeScript types (if needed):
```bash
npm install --save-dev @types/node-fetch
```

### Step 3: Configure Environment Variables

Create or update `.env`:

```bash
# Required
DATABASE_URL=postgresql://...

# If using MCP gateway
COMPOSIO_SERVER_URL=https://...
COMPOSIO_API_KEY=...
```

### Step 4: Use in Your Code

```typescript
import { logAgentError, ErrorTypes, resolveError } from './scripts/error-logger';

// Log an error
try {
  await yourOperation();
} catch (err) {
  const errorId = await logAgentError(
    'YOUR-AGENT-ID',           // e.g., 'IMO-CREATOR-AGENT'
    processId,                 // e.g., company_id, job_id
    ErrorTypes.SCHEMA_VALIDATION_FAILED,
    'Error message',
    {
      // Additional context
      repo: 'imo-creator',
      environment: 'production',
      stack: err.stack
    }
  );

  throw err;
}

// Resolve when fixed
await resolveError({
  error_id: errorId,
  resolved_by: 'YOUR-AGENT-ID',
  resolution_notes: 'How it was fixed'
});
```

---

## Standalone Error Logger (Copy-Paste Ready)

If you can't copy the file, here's a minimal standalone version:

```typescript
// scripts/error-logger.ts

import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const MCP_SERVER_URL = process.env.COMPOSIO_SERVER_URL!;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY!;

export const ErrorTypes = {
  // Validation
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Database
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  QUERY_EXECUTION_ERROR: 'QUERY_EXECUTION_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  DATA_CORRUPTION: 'DATA_CORRUPTION',

  // Network
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_UNREACHABLE: 'NETWORK_UNREACHABLE',

  // Transformation
  MAPPING_ERROR: 'MAPPING_ERROR',
  TRANSFORMATION_FAILED: 'TRANSFORMATION_FAILED',
  BLUEPRINT_NOT_FOUND: 'BLUEPRINT_NOT_FOUND',

  // System
  SYSTEM_FAILURE: 'SYSTEM_FAILURE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',

  // Agent
  AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
  DELEGATION_FAILED: 'DELEGATION_FAILED',
  HEIR_COORDINATION_ERROR: 'HEIR_COORDINATION_ERROR',

  // Export
  VENDOR_EXPORT_FAILED: 'VENDOR_EXPORT_FAILED',
  VENDOR_ID_MISSING: 'VENDOR_ID_MISSING',

  // Critical
  CRITICAL_VALIDATION_FAILURE: 'CRITICAL_VALIDATION_FAILURE'
} as const;

export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

export async function logAgentError(
  agentId: string,
  processId: string,
  errorType: ErrorType,
  errorMessage: string,
  details?: Record<string, any>
): Promise<string> {
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
          agentId,
          processId,
          errorType,
          errorMessage,
          details ? JSON.stringify(details) : null
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to log error: ${await res.text()}`);
    }

    const result = await res.json();
    const errorId = result.rows[0].log_error;

    console.error(`[ERROR LOGGED] ${errorType} - ${errorMessage} (ID: ${errorId})`);
    return errorId;
  } catch (err) {
    console.error('[ERROR LOGGER FAILURE]', err);
    console.error('[ORIGINAL ERROR]', { agentId, processId, errorType, errorMessage, details });
    throw err;
  }
}

export async function resolveError(
  errorId: string,
  resolvedBy: string,
  resolutionNotes?: string
): Promise<boolean> {
  try {
    const res = await fetch(`${MCP_SERVER_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({
        query: `SELECT shq.resolve_error($1, $2, $3)`,
        params: [errorId, resolvedBy, resolutionNotes || null]
      })
    });

    if (!res.ok) {
      throw new Error(`Failed to resolve error: ${await res.text()}`);
    }

    const result = await res.json();
    return result.rows[0].resolve_error;
  } catch (err) {
    console.error('[ERROR RESOLVER FAILURE]', err);
    throw err;
  }
}
```

---

## Agent ID Naming Convention

Use a consistent naming pattern for `agent_id` across all repos:

```
Format: <REPO>-<AGENT-TYPE>-<FUNCTION>

Examples:
- CLIENT-INTAKE-VALIDATOR
- IMO-CREATOR-BLUEPRINT-AGENT
- BARTON-OUTREACH-EMAIL-AGENT
- GARAGE-MCP-ORCHESTRATOR
- COMPLIANCE-CHECKER
- VENDOR-EXPORT-AGENT
```

This makes it easy to identify which repo/agent logged which error.

---

## Example: IMO Creator Integration

### File: `imo-creator/scripts/error-logger.ts`

```typescript
import { logAgentError, ErrorTypes } from './error-logger';

// In blueprint validation
try {
  await validateBlueprint(blueprintData);
} catch (err) {
  await logAgentError(
    'IMO-CREATOR-BLUEPRINT-VALIDATOR',  // Agent ID
    blueprintData.blueprint_id,          // Process ID
    ErrorTypes.SCHEMA_VALIDATION_FAILED,
    'Blueprint schema validation failed',
    {
      repo: 'imo-creator',
      blueprint_id: blueprintData.blueprint_id,
      field: 'stages',
      error: err.message,
      stack: err.stack
    }
  );
  throw err;
}
```

---

## Example: Barton Outreach Integration

### File: `barton-outreach/scripts/error-logger.ts`

```typescript
import { logAgentError, ErrorTypes } from './error-logger';

// In email sending
try {
  await sendMarketingEmail(emailData);
} catch (err) {
  await logAgentError(
    'BARTON-OUTREACH-EMAIL-AGENT',      // Agent ID
    emailData.campaign_id,               // Process ID
    ErrorTypes.API_REQUEST_FAILED,
    'Failed to send marketing email via SendGrid',
    {
      repo: 'barton-outreach',
      campaign_id: emailData.campaign_id,
      recipient: emailData.recipient,
      api_response: err.response,
      stack: err.stack
    }
  );
  throw err;
}
```

---

## Querying Errors from All Repos

### SQL Queries

```sql
-- All unresolved errors across all repos
SELECT * FROM shq.error_log_unresolved;

-- Errors by repo (using agent_id pattern)
SELECT
  SPLIT_PART(agent_id, '-', 1) as repo_name,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE resolved = FALSE) as unresolved_count
FROM shq.error_log
WHERE timestamp_created >= NOW() - INTERVAL '7 days'
GROUP BY repo_name
ORDER BY error_count DESC;

-- Errors from specific repo
SELECT * FROM shq.error_log
WHERE agent_id LIKE 'IMO-CREATOR-%'
  AND resolved = FALSE;

-- Critical errors across all repos
SELECT * FROM shq.error_log_critical;

-- Error summary by agent (all repos)
SELECT * FROM shq.error_log_summary_by_agent;
```

### TypeScript Queries (Any Repo)

```typescript
import { queryErrors, getUnresolvedErrors } from './scripts/error-logger';

// Get all unresolved errors (all repos)
const allUnresolved = await getUnresolvedErrors();

// Get errors from your repo only
const myRepoErrors = await queryErrors({
  agent_id: 'IMO-CREATOR-%',  // Partial match
  resolved: false
});

// Get errors from specific process
const processErrors = await queryErrors({
  process_id: 'blueprint-abc-123'
});
```

---

## Monitoring Dashboard (All Repos)

### CLI Commands (Run from Any Repo)

```bash
# Check unresolved errors (all repos)
npm run errors:check

# Check critical errors (all repos)
npm run errors:critical

# Show error summary by agent (all repos)
npm run errors:summary

# Recent errors from last 24 hours (all repos)
npm run errors:recent
```

### Add to package.json (Any Repo)

```json
{
  "scripts": {
    "errors:check": "tsx scripts/check-errors.ts",
    "errors:unresolved": "tsx scripts/check-errors.ts unresolved",
    "errors:critical": "tsx scripts/check-errors.ts critical",
    "errors:summary": "tsx scripts/check-errors.ts summary",
    "errors:recent": "tsx scripts/check-errors.ts recent"
  }
}
```

---

## Benefits of Single Centralized Table

### 1. **System-Wide Visibility**
- See all errors from all repos in one place
- Identify system-wide issues quickly
- Track error trends across the entire platform

### 2. **Cross-Repo Analysis**
- Compare error rates between repos
- Identify which repos/agents have most errors
- Spot patterns that span multiple repos

### 3. **Unified Monitoring**
- Single dashboard for all errors
- One set of alerting rules
- Consistent error categorization

### 4. **Resolution Tracking**
- See who's resolving errors across all repos
- Track resolution times by repo/agent
- Share resolution patterns

### 5. **Simplified Debugging**
- Trace errors across repo boundaries
- Follow process_id through multiple systems
- See complete error chain for complex workflows

---

## Error Details Best Practices

Always include in `details` JSONB field:

```typescript
{
  repo: 'repo-name',              // Which repo logged this
  environment: 'production',       // production, staging, development
  version: '1.0.0',               // Repo version
  process_id: 'uuid-123',         // Process/job ID
  user_id: 'user-uuid',           // User (if applicable)
  company_id: 'company-uuid',     // Company (if applicable)
  stack: err.stack,               // Stack trace
  context: {                      // Additional context
    // Specific to your operation
  }
}
```

---

## Database Schema Reference

### Table: `shq.error_log`

```sql
CREATE TABLE shq.error_log (
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
  timestamp_created TIMESTAMPTZ DEFAULT now()
);
```

### Functions Available

```sql
-- Log error
SELECT shq.log_error(
  agent_id TEXT,
  process_id TEXT,
  error_type TEXT,
  error_message TEXT,
  details JSONB
) RETURNS UUID;

-- Resolve error
SELECT shq.resolve_error(
  error_id UUID,
  resolved_by TEXT,
  resolution_notes TEXT
) RETURNS BOOLEAN;
```

### Views Available

- `shq.error_log_unresolved` - All unresolved errors
- `shq.error_log_summary_by_agent` - Stats by agent (30 days)
- `shq.error_log_critical` - Critical errors (7 days)

---

## Migration Check (For New Repos)

Before integrating, verify the error_log table exists:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'shq'
  AND table_name = 'error_log'
);

-- If false, run migration
-- Execute db/neon/06_error_log.sql
```

---

## Troubleshooting

### Error: "Table does not exist"

**Solution**: Run the migration in Neon:

```bash
# From client repo
psql $DATABASE_URL -f db/neon/06_error_log.sql
```

### Error: "Permission denied for schema shq"

**Solution**: Grant access to shq schema:

```sql
GRANT USAGE ON SCHEMA shq TO your_user;
GRANT SELECT, INSERT, UPDATE ON shq.error_log TO your_user;
```

### Error: "Function shq.log_error does not exist"

**Solution**: Functions are created in migration. Run:

```bash
psql $DATABASE_URL -f db/neon/06_error_log.sql
```

---

## Complete Integration Checklist

For each new repo:

- [ ] Copy `scripts/error-logger.ts` to repo
- [ ] Add `DATABASE_URL` to `.env`
- [ ] Add `COMPOSIO_SERVER_URL` and `COMPOSIO_API_KEY` to `.env` (if using MCP)
- [ ] Install dependencies: `npm install node-fetch dotenv`
- [ ] Verify table exists in Neon: `SELECT * FROM shq.error_log LIMIT 1`
- [ ] Test error logging: `await logAgentError(...)`
- [ ] Add error check scripts to `package.json`
- [ ] Document agent_id naming in repo README
- [ ] Add error logging to critical code paths
- [ ] Set up monitoring for unresolved errors

---

## Contact / Questions

- **Database Schema**: See `db/neon/06_error_log.sql` in client repo
- **Error Logger Code**: See `scripts/error-logger.ts` in client repo
- **Full Documentation**: See `db/neon/ERROR_LOG_README.md` in client repo
- **LLM Overview**: See `README_LLM_OVERVIEW.md` Section 4.4 and 5.6

---

**Last Updated**: 2025-10-20
**Schema Version**: 1.0.0
**Maintained By**: Client SubHive Team
