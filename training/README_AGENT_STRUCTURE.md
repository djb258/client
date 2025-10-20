# Agent Structure and Validation Flow

## Overview
This document explains how agents operate within the Client SubHive system, including validation workflows, promotion processes, and data transformation pipelines.

---

## 🤖 Agent Architecture

### Agent Types

The system uses **three primary agent types**:

1. **Validator Agents**
   - Validate data integrity before promotion
   - Enforce schema compliance
   - Check business rules
   - Examples: `SHQ-INTAKE-VALIDATOR`, `COMPLIANCE-CHECKER`

2. **Transformer Agents**
   - Transform canonical data to vendor-specific formats
   - Apply blueprint mappings
   - Handle data enrichment
   - Examples: `VENDOR-EXPORT-AGENT`

3. **Orchestration Agents**
   - Coordinate multi-step workflows
   - Delegate tasks to specialized subagents
   - Monitor and report progress
   - Examples: `SUBAGENT-DELEGATOR`, `REPO-MCP-ORCHESTRATOR`

---

## 🔄 Validation and Promotion Workflow

### Stage 1: Firebase Intake (INPUT Layer)

**User Action**: Fill out Client Intake Wizard

**System Action**:
```typescript
// File: apps/ui/src/services/firebase/intake-service.ts

1. Create company document in Firebase
   - Generate UUID for company_id
   - Inject blueprint versioning:
     * blueprint_version: "v1.0.0"
     * validator_signature: "SHQ-INTAKE-VALIDATOR"
     * timestamp_last_touched: ISO timestamp
   - Set validated: false
   - Set promoted_to_neon: false

2. Firestore Security Rules validate fields
   - Check hasVersioningFields()
   - Ensure all required fields present

3. Create audit log entry
   - Entity type: 'company'
   - Action: 'create'
   - Status: 'success'
```

**Data State**: `{ validated: false, promoted_to_neon: false }`

---

### Stage 2: Validation (AI/Agent Layer)

**Trigger**: User clicks "Validate" or automatic validation on submit

**Agent**: `SHQ-INTAKE-VALIDATOR`

**Validation Process**:
```typescript
// File: apps/ui/src/services/composio/client-intake.ts

export async function validateCompany(companyDoc: CompanyDocument) {
  // 1. Call Composio MCP validation endpoint
  const response = await fetch(`${COMPOSIO_MCP_URL}/validate/company`, {
    method: 'POST',
    body: JSON.stringify(companyDoc)
  });

  // 2. Composio performs:
  //    - Schema validation
  //    - Business rule checks
  //    - Data integrity verification
  //    - Duplicate detection

  // 3. Return validation result
  return {
    success: boolean,
    validated: boolean,
    job_id: string,
    errors: string[]
  };
}
```

**Agent Actions**:
1. **Schema Validation**
   - Required fields present
   - Data types correct
   - Format validation (EIN, dates, etc.)

2. **Business Rules**
   - Company name not duplicate
   - EIN valid and unique
   - Renewal date in future
   - HR tone configured

3. **Blueprint Compliance**
   - blueprint_version present
   - validator_signature present
   - timestamp_last_touched valid

**Update Firebase**:
```typescript
await updateDoc(companyRef, {
  validated: true,  // or false if validation fails
  composio_job_id: validationResult.job_id,
  last_touched: Timestamp.now()
});
```

**Audit Log**:
```typescript
await addDoc(collection(db, 'intake_audit_log'), {
  log_id: uuidv4(),
  entity_type: 'company',
  entity_id: companyId,
  action: 'validate',
  composio_job_id: validationResult.job_id,
  success: validationResult.success,
  errors: validationResult.errors,
  metadata: { validator: 'SHQ-INTAKE-VALIDATOR' },
  created_at: Timestamp.now()
});
```

**Data State**: `{ validated: true, promoted_to_neon: false }`

---

### Stage 3: Promotion to Neon (MIDDLE Layer)

**Trigger**: User clicks "Promote to Neon" (only enabled if validated: true)

**Agent**: `SHQ-INTAKE-VALIDATOR` (promotion mode)

**Promotion Process**:
```typescript
// File: apps/ui/src/services/composio/client-intake.ts

export async function promoteCompany(companyDoc: CompanyDocument) {
  // 1. Verify validation status
  if (!companyDoc.validated) {
    throw new Error('Company must be validated before promotion');
  }

  // 2. Call Composio MCP promotion endpoint
  const response = await fetch(`${COMPOSIO_MCP_URL}/promote/company`, {
    method: 'POST',
    body: JSON.stringify(companyDoc)
  });

  // 3. Composio writes to Neon via SQL
  //    INSERT INTO clnt.clients_subhive_master (...)
  //    VALUES (...);

  // 4. Return promotion result with Neon ID
  return {
    success: boolean,
    job_id: string,
    errors: string[],
    neon_id: string  // UUID in Neon
  };
}
```

**Agent Actions**:
1. **Pre-flight Checks**
   - Validation status confirmed
   - No existing Neon record
   - All required fields present

2. **Data Transformation**
   - Map Firebase fields → Neon canonical schema
   - Generate benefit IDs
   - Create vendor group number mappings

3. **Database Write**
   - INSERT into `clnt.clients_subhive_master`
   - Return Neon UUID

4. **Post-promotion Actions**
   - Update Firebase `promoted_to_neon: true`
   - Log to `shq.audit_log` in Neon
   - Update `last_touched` timestamp

**Update Firebase**:
```typescript
await updateDoc(companyRef, {
  promoted_to_neon: true,
  composio_job_id: promotionResult.job_id,
  neon_id: promotionResult.neon_id,  // Store Neon UUID for reference
  last_touched: Timestamp.now()
});
```

**Neon Audit Log**:
```sql
INSERT INTO shq.audit_log (
  company_id,
  agent_id,
  process_type,
  action,
  status,
  details,
  timestamp
) VALUES (
  'COMPANY_UUID',
  'SHQ-INTAKE-VALIDATOR',
  'intake_promotion',
  'promote',
  'success',
  '{"firebase_id": "...", "neon_id": "...", "validation_job_id": "..."}'::jsonb,
  NOW()
);
```

**Data State**: `{ validated: true, promoted_to_neon: true }`

---

### Stage 4: Vendor Export (OUTPUT Layer)

**Trigger**: Scheduled job or manual trigger

**Agent**: `VENDOR-EXPORT-AGENT`

**Export Process**:
```typescript
// File: scripts/run_vendor_export.ts

1. Fetch vendor blueprint
   - Get mapping from clnt.vendor_output_blueprint
   - Mapping defines: canonical_field → vendor_field

2. Fetch enrollments with vendor IDs
   - JOIN clnt.employee_benefit_enrollment
   - JOIN clnt.employee_vendor_ids (for vendor-specific IDs)
   - WHERE vendor_code = 'mutual_of_omaha'

3. Transform each record
   - Apply blueprint mapping
   - Include vendor_employee_id from employee_vendor_ids table
   - Handle null values

4. Insert into vendor output table
   - INSERT INTO clnt.vendor_output_mutualofomaha
   - Log success/failure count

5. Audit log
   - Record export completion
   - Include success/failure counts
   - Track duration_ms
```

**Agent Actions**:
1. **Blueprint Loading**
   - Fetch mapping from Neon
   - Parse JSON mapping structure

2. **Data Fetch**
   - Query canonical tables with JOINs
   - Include vendor_employee_id from employee_vendor_ids

3. **Transformation Loop**
   ```typescript
   for (const row of enrollments) {
     const record = {};
     for (const [sourceField, vendorField] of Object.entries(mapping)) {
       record[vendorField] = row[sourceField] ?? null;
     }
     if (row.vendor_employee_id) {
       record['vendor_employee_id'] = row.vendor_employee_id;
     }
     await insertExport(vendorTable, record);
   }
   ```

4. **Audit Logging**
   ```typescript
   await logAudit(companyId, 'export_complete', 'success', {
     vendor_id: vendorId,
     blueprint_id: blueprintId,
     success_count: successCount,
     failure_count: failureCount,
     duration_ms: durationMs
   });
   ```

---

## 🧩 Subagent Delegation

### Subagent Delegator

**File**: `mechanic/recall/subagent-delegator.py`

**Purpose**: Route complex repair tasks to specialized subagents

**Subagent Types**:
1. **Compliance Specialist**
   - Schema validation
   - HEIR configuration
   - Repo structure checks

2. **Database Specialist**
   - Migration issues
   - Query optimization
   - Schema design

3. **Security Auditor**
   - Firestore rules
   - API authentication
   - Data encryption

4. **DevOps Engineer**
   - CI/CD pipeline
   - Deployment issues
   - Environment configuration

5. **Testing Specialist**
   - Test coverage
   - Integration tests
   - E2E testing

**Delegation Process**:
```python
def delegate_task(repo_path, task_type, task_description):
    # 1. Analyze repository
    analysis = analyze_repo(repo_path)

    # 2. Determine appropriate subagent
    subagent = select_subagent(task_type, analysis)

    # 3. Prepare task context
    context = {
        'repo_path': repo_path,
        'task_type': task_type,
        'description': task_description,
        'repo_analysis': analysis
    }

    # 4. Invoke subagent
    result = invoke_subagent(subagent, context)

    # 5. Log delegation
    log_delegation(repo_path, subagent, result)

    return result
```

---

## 📊 Agent Communication Protocol

### HEIR Altitude System

Agents coordinate using altitude-based hierarchy:

| Altitude | Role | Agent Types | Responsibilities |
|----------|------|-------------|------------------|
| **30,000 ft** | Strategic | Orchestration Agents | Planning, workflow design, multi-agent coordination |
| **20,000 ft** | Tactical | Validation Agents | Analysis, decision-making, rule enforcement |
| **15,000 ft** | Operational | Documentation Agents | Monitoring, reporting, audit trail |
| **10,000 ft** | Implementation | Transformer Agents | Code changes, data transformation, exports |
| **5,000 ft** | Validation | Testing Agents | Testing, verification, compliance checks |

### Agent-to-Agent Communication

**MCP Protocol**:
```json
{
  "from_agent": "SUBAGENT-DELEGATOR",
  "to_agent": "DATABASE-SPECIALIST",
  "altitude": "10000ft",
  "task": {
    "type": "schema_validation",
    "priority": "high",
    "context": {
      "repo_path": "/path/to/repo",
      "table": "employee_vendor_ids",
      "issue": "Missing index on vendor_code"
    }
  }
}
```

---

## 🔍 Agent State Management

### Agent Lifecycle

1. **Initialize**
   - Load configuration
   - Connect to MCP server
   - Authenticate with Composio

2. **Execute**
   - Receive task
   - Perform validation/transformation
   - Log actions to audit_log

3. **Report**
   - Return result
   - Update task status
   - Trigger next agent in workflow

4. **Cleanup**
   - Release resources
   - Final audit log entry
   - Update agent registry

### State Tracking

**Agent Registry**: `claude-agents-library/manifest.json`
```json
{
  "agents": [
    {
      "id": "SHQ-INTAKE-VALIDATOR",
      "type": "validator",
      "altitude": "20000ft",
      "capabilities": ["company_validation", "employee_validation"],
      "status": "active",
      "last_run": "2025-10-20T12:00:00Z"
    }
  ]
}
```

---

## 🎯 Best Practices

### For Validator Agents
1. Always check blueprint versioning fields
2. Log all validation attempts to audit_log
3. Return clear, actionable error messages
4. Never modify data during validation (read-only)

### For Transformer Agents
1. Use blueprint mappings exclusively
2. Handle null values gracefully
3. Include vendor IDs from employee_vendor_ids table
4. Log transformation metrics (success/failure counts, duration)

### For Orchestration Agents
1. Coordinate at appropriate HEIR altitude
2. Delegate to specialized subagents when needed
3. Monitor task progress and timeouts
4. Provide detailed status updates

---

## 📚 Related Documentation

- `CTB_MAP.md` - System architecture overview
- `EXAMPLES.md` - Sample payloads and validation examples
- `README-CLIENT-INTAKE.md` - Client intake wizard documentation
- `composio.config.json` - MCP endpoint definitions
- `heir.doctrine.yaml` - HEIR configuration and altitudes
