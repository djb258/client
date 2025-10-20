# LLM Agent Overview: Client SubHive System

**Target Audience**: AI Agents, LLMs, Automated Systems
**Last Updated**: 2025-10-20
**System Version**: v1.0.0

---

## 1. Purpose of This Repository

This repository implements a **Client Data Intake and Vendor Export System** following the Barton Doctrine (IMO + ORBT).

### Core Functions

1. **Client Intake**: Manual data entry via 4-step wizard → Firebase staging → Neon canonical database
2. **Vendor Export**: Transform canonical data → vendor-specific output tables using blueprint mappings
3. **Audit Trail**: Log all agent actions, validations, and exports to `shq.audit_log`
4. **Vendor ID Tracking**: Cross-reference employee IDs across multiple benefit vendors

### Data Flow

```
User Input → Firebase (INPUT) → Validation → Neon Canonical (MIDDLE) → Vendor Export (OUTPUT)
```

### Technologies

- **Frontend**: React 18 + TypeScript + Vite (in `/apps/ui`)
- **Backend**: Node.js + TypeScript scripts, FastAPI (Python)
- **Databases**: Firebase Firestore (staging), Neon PostgreSQL (canonical + output)
- **Orchestration**: Composio MCP Gateway, HEIR agent system

---

## 2. Folder Structure Summary

```
client/
├── apps/ui/                    # React intake wizard UI
│   ├── src/
│   │   ├── components/wizard/  # 4-step intake wizard
│   │   ├── services/          # Firebase + Composio MCP clients
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── scripts/                    # Automation scripts
│   ├── run_vendor_export.ts   # Vendor export with audit logging
│   ├── run_migrations_via_mcp.ts
│   ├── promote_to_neon.ts
│   └── validate_registry.ts
│
├── db/neon/                    # Neon PostgreSQL schema
│   ├── 01_schema.sql          # Base canonical schema (clnt.*)
│   ├── 02_views.sql           # Database views
│   ├── 03_seed.sql            # Seed data
│   ├── 04_employee_vendor_ids.sql  # Vendor ID tracking table
│   ├── 05_audit_log.sql       # Audit logging table (shq.*)
│   └── client_subhive_intake.sql
│
├── firebase/                   # Firebase configuration
│   ├── types/firestore.ts     # TypeScript types with versioning
│   ├── firestore.rules        # Security rules (enforce versioning)
│   └── model.md
│
├── tools/                      # Python utilities
│   ├── repo_compliance_check.py
│   ├── imo_unified_registry.py
│   ├── repo_mcp_orchestrator.py
│   └── blueprint_doc_generator.py
│
├── training/                   # Agent training documentation
│   ├── CTB_MAP.md             # 5-layer architecture map
│   ├── README_AGENT_STRUCTURE.md  # Agent workflows
│   └── EXAMPLES.md            # Sample payloads and queries
│
├── garage-mcp/                 # MCP server (tool orchestration)
├── imo-creator/                # Blueprint planning app (nested repo)
├── barton-*/                   # Barton Outreach Core modules
├── claude-agents-library/      # Agent registry and manifests
└── package.json                # Root dependencies and scripts
```

---

## 3. CTB & ORBT Doctrine Overview

### CTB (Canonical-to-Blueprint) Architecture

**5-Layer System**:

| Layer | Purpose | Technologies | Location |
|-------|---------|--------------|----------|
| **1. System** | Infrastructure, MCP, HEIR | Python, MCP Protocol | `garage-mcp/`, `tools/` |
| **2. Data** | Storage (INPUT → MIDDLE → OUTPUT) | Firebase, Neon PostgreSQL | `db/neon/`, `firebase/` |
| **3. Application** | Business logic, services | TypeScript, Node.js, FastAPI | `scripts/`, `apps/ui/src/services/` |
| **4. AI/Agent** | Validation, transformation, orchestration | Claude Agents, HEIR | `claude-agents-library/` |
| **5. UI** | User interaction | React, Vite, TailwindCSS | `apps/ui/` |

### IMO (Input-Middle-Output) Data Flow

1. **INPUT Layer**: Firebase Firestore (temporary staging)
   - Collections: `company`, `employee`, `intake_audit_log`
   - Status: `validated: false → true`
   - Enforces blueprint versioning via security rules

2. **MIDDLE Layer**: Neon PostgreSQL canonical schema (`clnt.*`)
   - Tables: `clients_subhive_master`, `clients_active_census`, `employee_vendor_ids`
   - Vendor-neutral data model
   - Permanent source of truth

3. **OUTPUT Layer**: Neon vendor-specific tables
   - Tables: `vendor_output_mutualofomaha`, `vendor_output_guardianlife`
   - Generated from blueprint mappings
   - Export-ready format

### ORBT (Outreach + Barton)

- **Barton Doctrine**: Hierarchical marketing structure (Marketing > Outreach)
- **HEIR System**: Altitude-based agent coordination (30k, 20k, 15k, 10k, 5k ft)
- **Integrated Modules**: `barton-components/`, `barton-doctrine/`, `barton-pages/`

---

## 4. Key Enforcement Layers

### 4.1 Blueprint Versioning on Intake

**Required Fields on ALL Company/Employee Documents**:

```typescript
{
  blueprint_version: "v1.0.0",           // Semantic version
  validator_signature: "SHQ-INTAKE-VALIDATOR",  // Agent ID
  timestamp_last_touched: "2025-10-20T12:00:00.000Z"  // ISO timestamp
}
```

**Injection Points**:
- File: `apps/ui/src/services/firebase/intake-service.ts`
- Functions: `createCompanyInFirebase()`, `createEmployeeInFirebase()`
- Lines: 60-62 (company), 204-206 (employee)

**Type Definitions**:
- File: `firebase/types/firestore.ts`
- Interfaces: `CompanyDocument`, `EmployeeDocument`
- Lines: 24-27 (company), 55-58 (employee)

### 4.2 Firestore Validator Logic

**Security Rules**: `firebase/firestore.rules`

**Enforcement Function**:
```javascript
function hasVersioningFields() {
  return request.resource.data.blueprint_version is string
      && request.resource.data.validator_signature is string
      && request.resource.data.timestamp_last_touched is string;
}
```

**Applied To**:
- `company/{companyId}` collection (line 15)
- `employee/{employeeId}` collection (line 23)

**Result**: Documents without versioning fields will be **rejected at write time**

### 4.3 Audit Log (`shq.audit_log`)

**Schema**: `db/neon/05_audit_log.sql`

**Table**: `shq.audit_log`

**Columns**:
```sql
id UUID PRIMARY KEY
company_id TEXT
agent_id TEXT NOT NULL           -- e.g., "SHQ-INTAKE-VALIDATOR"
process_type TEXT NOT NULL       -- e.g., "intake_validation", "vendor_export"
action TEXT NOT NULL             -- e.g., "validate", "promote", "export"
status TEXT NOT NULL             -- "success" | "failure" | "pending" | "warning"
details JSONB                    -- Structured metadata
error_message TEXT
duration_ms INTEGER
timestamp TIMESTAMP DEFAULT now()
```

### 4.4 Error Log (`shq.error_log`)

**Schema**: `db/neon/06_error_log.sql`

**Table**: `shq.error_log`

**Columns**:
```sql
error_id UUID PRIMARY KEY
agent_id TEXT
process_id TEXT
error_type TEXT NOT NULL         -- e.g., "SCHEMA_VALIDATION_FAILED"
error_message TEXT NOT NULL
details JSONB                    -- Structured error context
resolved BOOLEAN DEFAULT FALSE
resolved_at TIMESTAMPTZ
resolved_by TEXT
resolution_notes TEXT
timestamp_created TIMESTAMPTZ
```

**Logging Function**: `scripts/error-logger.ts`

**Error Types**: Standardized error categories in `ErrorTypes` constant
- Validation: `SCHEMA_VALIDATION_FAILED`, `BUSINESS_RULE_VIOLATION`, `DUPLICATE_ENTRY`
- Database: `DATABASE_CONNECTION_ERROR`, `QUERY_EXECUTION_ERROR`, `DATA_CORRUPTION`
- Network: `API_REQUEST_FAILED`, `TIMEOUT_ERROR`
- Transformation: `MAPPING_ERROR`, `TRANSFORMATION_FAILED`
- System: `SYSTEM_FAILURE`, `CONFIGURATION_ERROR`, `SECURITY_VIOLATION`
- Critical: `CRITICAL_VALIDATION_FAILURE`

**Usage Example**:
```typescript
import { logAgentError, ErrorTypes } from './scripts/error-logger';

try {
  await validateCompany(companyData);
} catch (err) {
  await logAgentError(
    'SHQ-INTAKE-VALIDATOR',
    companyData.company_id,
    ErrorTypes.SCHEMA_VALIDATION_FAILED,
    'Company EIN format invalid',
    { field: 'ein', expected: 'XX-XXXXXXX', received: companyData.ein }
  );
  throw err;
}
```

**Views**:
- `shq.error_log_unresolved` - Unresolved errors with hours elapsed
- `shq.error_log_summary_by_agent` - Error statistics by agent (30 days)
- `shq.error_log_critical` - Critical errors requiring immediate attention (7 days)

**Functions**:
- `shq.log_error()` - Insert error record
- `shq.resolve_error()` - Mark error as resolved with notes

**Logging Function**: `scripts/run_vendor_export.ts:92-114`

**Example**:
```typescript
await logAudit(companyId, 'export_complete', 'success', {
  vendor_id: vendorId,
  blueprint_id: blueprintId,
  success_count: 25,
  failure_count: 0,
  duration_ms: 2340
});
```

**Queries**:
- Recent activity: `SELECT * FROM shq.audit_log_recent ORDER BY timestamp DESC`
- By agent: `WHERE agent_id = 'SHQ-INTAKE-VALIDATOR'`
- Failures only: `WHERE status = 'failure'`
- Performance: `SELECT agent_id, AVG(duration_ms) FROM shq.audit_log GROUP BY agent_id`

### 4.5 Vendor Mapping Table (`clnt.employee_vendor_ids`)

**Schema**: `db/neon/04_employee_vendor_ids.sql`

**Table**: `clnt.employee_vendor_ids`

**Purpose**: Track vendor-specific employee IDs for cross-reference during exports

**Columns**:
```sql
id UUID PRIMARY KEY
company_id TEXT NOT NULL
employee_id TEXT NOT NULL
vendor_code TEXT NOT NULL        -- e.g., "mutual_of_omaha"
vendor_employee_id TEXT NOT NULL -- e.g., "MO-EMP-12345"
effective_date DATE NOT NULL
termination_date DATE
validated BOOLEAN DEFAULT FALSE
timestamp_last_touched TIMESTAMP
created_at TIMESTAMP
```

**Unique Constraint**: `(employee_id, vendor_code)` — one vendor ID per employee per vendor

**Usage in Exports**: `scripts/run_vendor_export.ts:60-63`
```typescript
LEFT JOIN clnt.employee_vendor_ids evi
  ON ebe.employee_id = evi.employee_id
  AND evi.vendor_code = 'mutual_of_omaha'
```

**Indexes**:
- `idx_employee_vendor_ids_company` (company_id)
- `idx_employee_vendor_ids_employee` (employee_id)
- `idx_employee_vendor_ids_vendor` (vendor_code)
- `idx_employee_vendor_ids_validated` (validated)

---

## 5. Agent Instruction Set

### 5.1 Agent Types and Responsibilities

| Agent ID | Type | Altitude | Responsibilities |
|----------|------|----------|------------------|
| `SHQ-INTAKE-VALIDATOR` | Validator | 20,000 ft | Validate company/employee data before Neon promotion |
| `VENDOR-EXPORT-AGENT` | Transformer | 10,000 ft | Transform canonical → vendor-specific tables |
| `COMPLIANCE-CHECKER` | Validator | 20,000 ft | Enforce repo standards and schema compliance |
| `SUBAGENT-DELEGATOR` | Orchestration | 30,000 ft | Route repair tasks to specialized subagents |
| `REPO-MCP-ORCHESTRATOR` | Orchestration | 30,000 ft | Coordinate MCP tool execution |

### 5.2 Validation Workflow

**Agent**: `SHQ-INTAKE-VALIDATOR`

**Steps**:
1. **Receive** company/employee document from Firebase
2. **Verify** blueprint versioning fields present
3. **Validate** schema, business rules, data integrity
4. **Check** for duplicates in Neon canonical tables
5. **Return** validation result with errors array
6. **Update** Firebase: `validated: true/false`, `composio_job_id`
7. **Log** to Firebase `intake_audit_log` collection

**Code Reference**: `apps/ui/src/services/composio/client-intake.ts:79-103`

### 5.3 Promotion Workflow

**Agent**: `SHQ-INTAKE-VALIDATOR` (promotion mode)

**Steps**:
1. **Verify** `validated: true` in Firebase document
2. **Check** not already promoted (`promoted_to_neon: false`)
3. **Transform** Firebase document → Neon canonical schema
4. **Insert** into `clnt.clients_subhive_master` or `clnt.clients_active_census`
5. **Return** Neon UUID
6. **Update** Firebase: `promoted_to_neon: true`, `neon_id`
7. **Log** to `shq.audit_log` in Neon

**Code Reference**: `apps/ui/src/services/composio/client-intake.ts:108-147`

### 5.4 Export Workflow

**Agent**: `VENDOR-EXPORT-AGENT`

**Steps**:
1. **Fetch** vendor blueprint from `clnt.vendor_output_blueprint`
2. **Query** enrollments with JOINs:
   - `clnt.employee_benefit_enrollment`
   - `clnt.benefit_master`
   - `clnt.company_vendor_link`
   - `clnt.employee_vendor_ids` (LEFT JOIN for vendor-specific IDs)
3. **Transform** each record using blueprint mapping
4. **Include** `vendor_employee_id` from `employee_vendor_ids` table
5. **Insert** into vendor output table (e.g., `vendor_output_mutualofomaha`)
6. **Count** success/failure records
7. **Log** to `shq.audit_log` with counts and duration

**Code Reference**: `scripts/run_vendor_export.ts:116-173`

### 5.5 Audit Logging Requirements

**ALL agents MUST log to `shq.audit_log`**:
- Action start (status: 'pending')
- Action completion (status: 'success' or 'failure')
- Detailed metadata in `details` JSONB column
- Duration in milliseconds (`duration_ms`)

**Audit Function Template**:
```typescript
await logAudit(companyId, action, status, {
  // Structured metadata
  vendor_id: string,
  success_count: number,
  failure_count: number,
  duration_ms: number,
  error?: string
});
```

### 5.6 Error Logging Requirements

**ALL agents MUST log errors to `shq.error_log`**:
- Use standardized error types from `ErrorTypes` constant
- Include process_id (company_id, job_id, etc.)
- Provide detailed error context in `details` JSONB
- Include stack traces when available

**Error Logging Template**:
```typescript
import { logAgentError, ErrorTypes } from './scripts/error-logger';

try {
  // Agent operation
  await performTask();
} catch (err) {
  const errorId = await logAgentError(
    'AGENT-ID',
    processId,
    ErrorTypes.APPROPRIATE_TYPE,
    'Clear error message',
    {
      context: 'additional context',
      stack: err.stack,
      input_data: sanitizedInput
    }
  );

  // Continue error handling
  throw err;
}
```

**Error Resolution**:
```typescript
import { resolveError } from './scripts/error-logger';

await resolveError({
  error_id: 'error-uuid',
  resolved_by: 'AGENT-ID',
  resolution_notes: 'Description of how error was fixed'
});
```

### 5.7 Error Handling (HEIR System)

**Altitude-Based Escalation**:

| Altitude | Error Type | Action |
|----------|------------|--------|
| **5,000 ft** | Validation errors, schema mismatches | Return detailed errors to UI, retry with corrections |
| **10,000 ft** | Transformation errors, mapping issues | Log error, skip record, continue processing |
| **15,000 ft** | Database connection errors | Retry with exponential backoff, log duration |
| **20,000 ft** | Business rule violations | Escalate to human review, log to audit_log |
| **30,000 ft** | System-wide failures | Halt workflow, delegate to specialized subagents |

**Error Logging Format**:
```typescript
{
  status: 'failure',
  error_message: 'Clear description of error',
  details: {
    error_code: 'SCHEMA_VALIDATION_FAILED',
    field: 'ein',
    expected: 'XX-XXXXXXX',
    received: '12345678'
  }
}
```

---

## 6. Future Agent References

### 6.1 Essential Files for Context

| File | Purpose | When to Read |
|------|---------|--------------|
| `training/CTB_MAP.md` | System architecture overview | First time bootstrapping |
| `training/README_AGENT_STRUCTURE.md` | Agent workflows and validation | Before validation/promotion tasks |
| `training/EXAMPLES.md` | Sample payloads and queries | When constructing requests/queries |
| `firebase/types/firestore.ts` | TypeScript type definitions | When handling Firebase documents |
| `firebase/firestore.rules` | Security rules and constraints | When creating new collections |
| `db/neon/01_schema.sql` | Canonical schema structure | When querying/inserting to Neon |
| `db/neon/04_employee_vendor_ids.sql` | Vendor ID tracking table | When handling vendor exports |
| `db/neon/05_audit_log.sql` | Audit logging schema | When logging agent actions |
| `db/neon/06_error_log.sql` | Error logging schema | When implementing error handling |
| `scripts/error-logger.ts` | Error logging utility | When logging or querying errors |
| `composio.config.json` | MCP endpoint definitions | When calling Composio gateway |
| `heir.doctrine.yaml` | HEIR configuration and altitudes | When coordinating multi-agent workflows |
| `package.json` | Available npm scripts | When running commands |

### 6.2 Configuration Files

**Environment Variables**: `.env.example`
```bash
# Neon Database
DATABASE_URL=postgresql://...
NEON_DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=client-subhive-intake

# Composio MCP
COMPOSIO_SERVER_URL=https://...
COMPOSIO_API_KEY=...

# LLM Providers
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

**MCP Server Config**: `config/imo_registry.yaml`
- Composio app configurations
- MCP server settings
- Tool execution settings
- Workflow definitions (complete, quick_check, fix_only)

**Agent Registry**: `claude-agents-library/manifest.json`
- List of all available agents
- Agent capabilities and altitudes
- Status and last_run timestamps

### 6.3 Bootstrap Process for New Agents

**Step 1: Read Architecture**
```bash
1. Read: training/CTB_MAP.md
2. Read: training/README_AGENT_STRUCTURE.md
3. Read: training/EXAMPLES.md
```

**Step 2: Understand Data Models**
```bash
1. Read: firebase/types/firestore.ts
2. Read: db/neon/01_schema.sql
3. Read: db/neon/04_employee_vendor_ids.sql
4. Read: db/neon/05_audit_log.sql
```

**Step 3: Review Enforcement Rules**
```bash
1. Read: firebase/firestore.rules
2. Verify: Blueprint versioning requirements
3. Check: Audit logging patterns in scripts/
```

**Step 4: Test Environment**
```bash
1. Check: .env file exists with required keys
2. Run: npm install (root level)
3. Run: cd apps/ui && npm install
4. Test: npm run test
```

**Step 5: Execute Task**
```bash
1. Identify: Agent type (Validator/Transformer/Orchestration)
2. Determine: HEIR altitude (5k/10k/15k/20k/30k ft)
3. Log: Start action to audit_log (status: 'pending')
4. Execute: Task with error handling (log errors to error_log)
5. Log: Complete action (status: 'success'/'failure')
6. Resolve: Any errors that were fixed during execution
```

### 6.4 Common Commands

```bash
# UI Development
npm run dev-ui              # Start UI dev server
npm run build-ui            # Build UI for production

# Database
npm run migrate             # Run migrations via MCP
npm run promote             # Promote Firebase → Neon
npm run export:run          # Run vendor exports

# Testing
npm run test                # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Compliance & Orchestration
npm run compliance:check    # Check repo compliance
npm run compliance:fix      # Auto-fix compliance issues
npm run orchestrate         # Run MCP orchestrator

# IMO Workflows
npm run imo:workflow        # Complete workflow
npm run imo:workflow-quick  # Quick check only
npm run imo:workflow-fix    # Fix-only mode
```

### 6.5 File Modification Guidelines

**NEVER Modify**:
- `db/neon/01_schema.sql` (base canonical schema - migrations only)
- `firebase/firestore.rules` (security rules - careful changes only)
- `package.json` dependencies (without testing)

**Always Modify with Caution**:
- `apps/ui/src/services/` (service layer - affects UI)
- `scripts/run_vendor_export.ts` (vendor exports - test thoroughly)
- `firebase/types/firestore.ts` (TypeScript types - rebuild required)

**Safe to Modify**:
- `training/*.md` (documentation)
- `tools/*.py` (Python utilities)
- `db/neon/0X_*.sql` (new migrations only)

### 6.6 Debugging and Troubleshooting

**Check Audit Logs**:
```sql
-- Recent failures
SELECT * FROM shq.audit_log
WHERE status = 'failure'
  AND timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Agent performance
SELECT agent_id, COUNT(*), AVG(duration_ms)
FROM shq.audit_log
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY agent_id;
```

**Check Firebase Documents**:
```typescript
// Check validation status
const company = await getCompanyById(companyId);
console.log(company.validated, company.promoted_to_neon);

// Check audit logs
const logs = await getDocs(collection(db, 'intake_audit_log'));
```

**Check Vendor Exports**:
```sql
-- Check recent exports
SELECT * FROM clnt.vendor_output_mutualofomaha
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Check employee vendor IDs
SELECT * FROM clnt.employee_vendor_ids
WHERE employee_id = 'YOUR_EMPLOYEE_ID';
```

**Check Error Logs**:
```typescript
import { getUnresolvedErrors, getCriticalErrors, getErrorSummaryByAgent } from './scripts/error-logger';

// Get unresolved errors
const unresolved = await getUnresolvedErrors(50);

// Get critical errors
const critical = await getCriticalErrors();

// Get error summary by agent
const summary = await getErrorSummaryByAgent();
```

**Or via SQL**:
```sql
-- Unresolved errors
SELECT * FROM shq.error_log_unresolved;

-- Critical errors
SELECT * FROM shq.error_log_critical;

-- Error summary
SELECT * FROM shq.error_log_summary_by_agent;
```

---

## 7. Quick Reference Card

### Data Flow Summary
```
User → UI (/apps/ui) → Firebase (INPUT) → Validator Agent → Neon (MIDDLE) → Export Agent → Vendor Tables (OUTPUT) → Audit Log
```

### Required Versioning Fields
```typescript
blueprint_version: "v1.0.0"
validator_signature: "SHQ-INTAKE-VALIDATOR"
timestamp_last_touched: "ISO-8601 timestamp"
```

### Agent Action Checklist
- [ ] Read architecture docs (`training/`)
- [ ] Verify blueprint versioning fields
- [ ] Log action start to `shq.audit_log`
- [ ] Execute task with error handling
- [ ] Log errors to `shq.error_log` with appropriate error type
- [ ] Include vendor IDs from `employee_vendor_ids` table
- [ ] Log action completion with duration
- [ ] Resolve any fixed errors with resolution notes
- [ ] Return structured result

### Key Database Schemas
- **INPUT**: `company`, `employee` (Firebase Firestore)
- **MIDDLE**: `clnt.clients_subhive_master`, `clnt.clients_active_census` (Neon)
- **OUTPUT**: `clnt.vendor_output_*` (Neon)
- **AUDIT**: `shq.audit_log` (Neon)
- **ERRORS**: `shq.error_log` (Neon)
- **MAPPING**: `clnt.employee_vendor_ids` (Neon)

### HEIR Altitudes
- **30k ft**: Strategic orchestration
- **20k ft**: Tactical validation
- **15k ft**: Operational monitoring
- **10k ft**: Implementation transforms
- **5k ft**: Validation testing

---

## End of LLM Overview

**Document Version**: 1.0.0
**Generated**: 2025-10-20
**Maintained By**: Automated Documentation System
**For Questions**: See `training/` directory for detailed examples
