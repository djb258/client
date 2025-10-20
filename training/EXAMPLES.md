# Client Intake Examples and Validation Flows

## Overview
This document provides practical examples of client intake payloads, validation flows, and common scenarios to help developers and agents understand the data structures and workflows.

---

## 📋 Example 1: Complete Company Intake Payload

### Firebase Company Document

```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Acme Corporation",
  "ein": "12-3456789",
  "address": "123 Main Street, Springfield, IL 62701",
  "industry": "Manufacturing",
  "internal_group_number": "ACME-2025-001",
  "vendor_group_numbers": {
    "mutual_of_omaha": "MO-987654",
    "guardian_life": "GL-123456"
  },
  "renewal_date": "2025-12-31T00:00:00.000Z",
  "hr_tone": {
    "tone": "professional",
    "sample_phrases": [
      "We value your contributions",
      "Please review your benefits package"
    ],
    "communication_style": "Direct and informative",
    "preferred_salutation": "Dear Team Member"
  },
  "composio_job_id": null,
  "validated": false,
  "promoted_to_neon": false,
  "last_touched": {
    "_seconds": 1729425000,
    "_nanoseconds": 0
  },
  "created_at": {
    "_seconds": 1729425000,
    "_nanoseconds": 0
  },
  "blueprint_version": "v1.0.0",
  "validator_signature": "SHQ-INTAKE-VALIDATOR",
  "timestamp_last_touched": "2025-10-20T12:30:00.000Z"
}
```

### Validation Result

```json
{
  "success": true,
  "validated": true,
  "job_id": "VAL-550e8400-20251020-1230",
  "errors": []
}
```

### After Validation Update

```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Acme Corporation",
  "ein": "12-3456789",
  "address": "123 Main Street, Springfield, IL 62701",
  "industry": "Manufacturing",
  "internal_group_number": "ACME-2025-001",
  "vendor_group_numbers": {
    "mutual_of_omaha": "MO-987654",
    "guardian_life": "GL-123456"
  },
  "renewal_date": "2025-12-31T00:00:00.000Z",
  "hr_tone": {
    "tone": "professional",
    "sample_phrases": [
      "We value your contributions",
      "Please review your benefits package"
    ],
    "communication_style": "Direct and informative",
    "preferred_salutation": "Dear Team Member"
  },
  "composio_job_id": "VAL-550e8400-20251020-1230",
  "validated": true,
  "promoted_to_neon": false,
  "last_touched": {
    "_seconds": 1729425300,
    "_nanoseconds": 0
  },
  "created_at": {
    "_seconds": 1729425000,
    "_nanoseconds": 0
  },
  "blueprint_version": "v1.0.0",
  "validator_signature": "SHQ-INTAKE-VALIDATOR",
  "timestamp_last_touched": "2025-10-20T12:35:00.000Z"
}
```

### Neon Canonical Record (After Promotion)

```sql
-- clnt.clients_subhive_master
INSERT INTO clnt.clients_subhive_master (
  company_id,
  company_name,
  ein,
  address,
  industry,
  internal_group_number,
  vendor_group_numbers,
  renewal_date,
  hr_tone,
  validated,
  promoted,
  blueprint_version,
  validator_signature,
  last_touched
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Acme Corporation',
  '12-3456789',
  '123 Main Street, Springfield, IL 62701',
  'Manufacturing',
  'ACME-2025-001',
  '{"mutual_of_omaha": "MO-987654", "guardian_life": "GL-123456"}'::jsonb,
  '2025-12-31'::date,
  '{"tone": "professional", "sample_phrases": [...], "communication_style": "Direct and informative", "preferred_salutation": "Dear Team Member"}'::jsonb,
  true,
  true,
  'v1.0.0',
  'SHQ-INTAKE-VALIDATOR',
  '2025-10-20 12:35:00'::timestamp
);
```

---

## 📋 Example 2: Employee Intake Payload

### Firebase Employee Document

```json
{
  "employee_id": "660e8400-e29b-41d4-a716-446655440111",
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Smith",
  "internal_employee_number": "EMP-001",
  "vendor_employee_ids": {
    "mutual_of_omaha": "MO-EMP-12345",
    "guardian_life": "GL-EMP-67890"
  },
  "benefit_type": "medical",
  "coverage_tier": "employee+spouse",
  "dependents": [
    {
      "name": "Jane Smith",
      "relationship": "spouse",
      "dob": "1985-05-15",
      "ssn": null
    }
  ],
  "composio_job_id": null,
  "validated": false,
  "promoted_to_neon": false,
  "last_touched": {
    "_seconds": 1729425600,
    "_nanoseconds": 0
  },
  "created_at": {
    "_seconds": 1729425600,
    "_nanoseconds": 0
  },
  "blueprint_version": "v1.0.0",
  "validator_signature": "SHQ-INTAKE-VALIDATOR",
  "timestamp_last_touched": "2025-10-20T13:00:00.000Z"
}
```

### Neon Employee Vendor ID Record

```sql
-- clnt.employee_vendor_ids
INSERT INTO clnt.employee_vendor_ids (
  company_id,
  employee_id,
  vendor_code,
  vendor_employee_id,
  effective_date,
  validated
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440111',
    'mutual_of_omaha',
    'MO-EMP-12345',
    '2025-10-20',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440111',
    'guardian_life',
    'GL-EMP-67890',
    '2025-10-20',
    true
  );
```

---

## ❌ Example 3: Validation Failure Scenarios

### Scenario A: Missing Blueprint Versioning Fields

**Payload**:
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Acme Corporation",
  "ein": "12-3456789",
  "validated": false,
  "promoted_to_neon": false
  // Missing: blueprint_version, validator_signature, timestamp_last_touched
}
```

**Firestore Security Rule Rejection**:
```
Error: Permission denied
Reason: hasVersioningFields() returned false
Required fields: blueprint_version, validator_signature, timestamp_last_touched
```

### Scenario B: Invalid EIN Format

**Payload**:
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Acme Corporation",
  "ein": "12345678",  // Invalid: missing dash
  "blueprint_version": "v1.0.0",
  "validator_signature": "SHQ-INTAKE-VALIDATOR",
  "timestamp_last_touched": "2025-10-20T12:30:00.000Z"
}
```

**Validation Result**:
```json
{
  "success": false,
  "validated": false,
  "job_id": "VAL-550e8400-20251020-1230",
  "errors": [
    "EIN format invalid. Expected format: XX-XXXXXXX"
  ]
}
```

### Scenario C: Duplicate Company Name

**Payload**:
```json
{
  "company_id": "770e8400-e29b-41d4-a716-446655440222",
  "company_name": "Acme Corporation",  // Already exists in Neon
  "ein": "98-7654321",
  "blueprint_version": "v1.0.0",
  "validator_signature": "SHQ-INTAKE-VALIDATOR",
  "timestamp_last_touched": "2025-10-20T13:00:00.000Z"
}
```

**Validation Result**:
```json
{
  "success": false,
  "validated": false,
  "job_id": "VAL-770e8400-20251020-1300",
  "errors": [
    "Company name 'Acme Corporation' already exists in system",
    "Existing company_id: 550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

---

## 🔄 Example 4: Complete Workflow End-to-End

### Step 1: User Fills Wizard

**UI Component**: `CompanySetupStep.tsx`

**Form Data**:
```typescript
const formData = {
  company_name: "TechStart Inc.",
  ein: "45-6789012",
  address: "456 Innovation Drive, Austin, TX 78701",
  industry: "Technology",
  internal_group_number: "TECH-2025-042",
  vendor_group_numbers: {
    mutual_of_omaha: "MO-456789",
    guardian_life: "GL-987654"
  },
  renewal_date: new Date("2026-01-15"),
  hr_tone: {
    tone: "friendly",
    sample_phrases: ["Hey team!", "Let's collaborate"],
    communication_style: "Casual and approachable",
    preferred_salutation: "Hi"
  }
};
```

### Step 2: Firebase Write

**Service Call**: `createCompanyInFirebase()`

**Firebase Document Created**:
```json
{
  "company_id": "880e8400-e29b-41d4-a716-446655440333",
  "company_name": "TechStart Inc.",
  "ein": "45-6789012",
  "address": "456 Innovation Drive, Austin, TX 78701",
  "industry": "Technology",
  "internal_group_number": "TECH-2025-042",
  "vendor_group_numbers": {
    "mutual_of_omaha": "MO-456789",
    "guardian_life": "GL-987654"
  },
  "renewal_date": "2026-01-15T00:00:00.000Z",
  "hr_tone": {
    "tone": "friendly",
    "sample_phrases": ["Hey team!", "Let's collaborate"],
    "communication_style": "Casual and approachable",
    "preferred_salutation": "Hi"
  },
  "validated": false,
  "promoted_to_neon": false,
  "created_at": "2025-10-20T14:00:00.000Z",
  "last_touched": "2025-10-20T14:00:00.000Z",
  "blueprint_version": "v1.0.0",
  "validator_signature": "SHQ-INTAKE-VALIDATOR",
  "timestamp_last_touched": "2025-10-20T14:00:00.000Z"
}
```

**Audit Log Entry**:
```json
{
  "log_id": "AUDIT-880e8400-CREATE",
  "entity_type": "company",
  "entity_id": "880e8400-e29b-41d4-a716-446655440333",
  "action": "create",
  "composio_job_id": null,
  "success": true,
  "errors": [],
  "metadata": {
    "source": "intake_wizard",
    "user_agent": "Mozilla/5.0..."
  },
  "created_at": "2025-10-20T14:00:00.000Z"
}
```

### Step 3: Validation

**Service Call**: `validateCompanyInFirebase()`

**Composio MCP Request**:
```http
POST https://composio-mcp.example.com/validate/company
Content-Type: application/json

{
  "company_id": "880e8400-e29b-41d4-a716-446655440333",
  "company_name": "TechStart Inc.",
  "ein": "45-6789012",
  ...
}
```

**Composio MCP Response**:
```json
{
  "success": true,
  "validated": true,
  "job_id": "VAL-880e8400-20251020-1400",
  "errors": [],
  "checks_performed": [
    "schema_validation",
    "ein_format_check",
    "duplicate_detection",
    "business_rules_validation",
    "blueprint_compliance"
  ]
}
```

**Firebase Update**:
```json
{
  "validated": true,
  "composio_job_id": "VAL-880e8400-20251020-1400",
  "last_touched": "2025-10-20T14:00:30.000Z"
}
```

**Audit Log Entry**:
```json
{
  "log_id": "AUDIT-880e8400-VALIDATE",
  "entity_type": "company",
  "entity_id": "880e8400-e29b-41d4-a716-446655440333",
  "action": "validate",
  "composio_job_id": "VAL-880e8400-20251020-1400",
  "success": true,
  "errors": [],
  "metadata": {
    "validator": "SHQ-INTAKE-VALIDATOR",
    "checks_performed": 5
  },
  "created_at": "2025-10-20T14:00:30.000Z"
}
```

### Step 4: Promotion to Neon

**Service Call**: `promoteCompanyToNeon()`

**Composio MCP Request**:
```http
POST https://composio-mcp.example.com/promote/company
Content-Type: application/json

{
  "company_id": "880e8400-e29b-41d4-a716-446655440333",
  "company_name": "TechStart Inc.",
  "ein": "45-6789012",
  ...
}
```

**Neon SQL Execution**:
```sql
INSERT INTO clnt.clients_subhive_master (
  company_id,
  company_name,
  ein,
  address,
  industry,
  internal_group_number,
  vendor_group_numbers,
  renewal_date,
  hr_tone,
  validated,
  promoted,
  blueprint_version,
  validator_signature,
  last_touched
) VALUES (
  '880e8400-e29b-41d4-a716-446655440333',
  'TechStart Inc.',
  '45-6789012',
  '456 Innovation Drive, Austin, TX 78701',
  'Technology',
  'TECH-2025-042',
  '{"mutual_of_omaha": "MO-456789", "guardian_life": "GL-987654"}'::jsonb,
  '2026-01-15'::date,
  '{"tone": "friendly", ...}'::jsonb,
  true,
  true,
  'v1.0.0',
  'SHQ-INTAKE-VALIDATOR',
  '2025-10-20 14:01:00'::timestamp
) RETURNING company_id;
```

**Composio MCP Response**:
```json
{
  "success": true,
  "job_id": "PROM-880e8400-20251020-1401",
  "errors": [],
  "promoted_table": "company",
  "neon_id": "880e8400-e29b-41d4-a716-446655440333"
}
```

**Firebase Update**:
```json
{
  "promoted_to_neon": true,
  "neon_id": "880e8400-e29b-41d4-a716-446655440333",
  "composio_job_id": "PROM-880e8400-20251020-1401",
  "last_touched": "2025-10-20T14:01:00.000Z"
}
```

**Neon Audit Log**:
```sql
INSERT INTO shq.audit_log (
  company_id,
  agent_id,
  process_type,
  action,
  status,
  details
) VALUES (
  '880e8400-e29b-41d4-a716-446655440333',
  'SHQ-INTAKE-VALIDATOR',
  'intake_promotion',
  'promote',
  'success',
  '{"firebase_id": "880e8400-e29b-41d4-a716-446655440333", "neon_id": "880e8400-e29b-41d4-a716-446655440333", "validation_job_id": "VAL-880e8400-20251020-1400"}'::jsonb
);
```

### Step 5: Vendor Export

**Script**: `npm run export:run`

**Vendor**: Mutual of Omaha

**Blueprint Query**:
```sql
SELECT * FROM clnt.vendor_output_blueprint
WHERE blueprint_id = 'mutual_of_omaha_blueprint';
```

**Blueprint Mapping**:
```json
{
  "mapping_json": {
    "company_name": "group_name",
    "ein": "tax_id",
    "internal_group_number": "group_number",
    "first_name": "member_first_name",
    "last_name": "member_last_name",
    "benefit_type": "coverage_type"
  }
}
```

**Enrollment Query with Vendor IDs**:
```sql
SELECT
  ebe.enrollment_id,
  ebe.employee_id,
  c.company_name,
  c.ein,
  c.internal_group_number,
  emp.first_name,
  emp.last_name,
  ebe.benefit_type,
  evi.vendor_employee_id
FROM clnt.employee_benefit_enrollment ebe
JOIN clnt.benefit_master bm ON ebe.benefit_unique_id = bm.benefit_unique_id
JOIN clnt.company_vendor_link cvl ON bm.company_vendor_id = cvl.company_vendor_id
JOIN clnt.clients_subhive_master c ON cvl.company_id = c.company_id
JOIN clnt.clients_active_census emp ON ebe.employee_id = emp.employee_id
LEFT JOIN clnt.employee_vendor_ids evi
  ON ebe.employee_id = evi.employee_id
  AND evi.vendor_code = 'mutual_of_omaha'
WHERE cvl.vendor_id = 'MUTUAL_OF_OMAHA_VENDOR_UUID';
```

**Transformed Record**:
```json
{
  "group_name": "TechStart Inc.",
  "tax_id": "45-6789012",
  "group_number": "MO-456789",
  "member_first_name": "John",
  "member_last_name": "Smith",
  "coverage_type": "medical",
  "vendor_employee_id": "MO-EMP-12345"
}
```

**Vendor Output Insert**:
```sql
INSERT INTO clnt.vendor_output_mutualofomaha (
  group_name,
  tax_id,
  group_number,
  member_first_name,
  member_last_name,
  coverage_type,
  vendor_employee_id
) VALUES (
  'TechStart Inc.',
  '45-6789012',
  'MO-456789',
  'John',
  'Smith',
  'medical',
  'MO-EMP-12345'
);
```

**Audit Log**:
```sql
INSERT INTO shq.audit_log (
  company_id,
  agent_id,
  process_type,
  action,
  status,
  details,
  duration_ms
) VALUES (
  '880e8400-e29b-41d4-a716-446655440333',
  'VENDOR-EXPORT-AGENT',
  'vendor_export',
  'export_complete',
  'success',
  '{"vendor_id": "MUTUAL_OF_OMAHA_VENDOR_UUID", "blueprint_id": "mutual_of_omaha_blueprint", "success_count": 25, "failure_count": 0, "total_records": 25}'::jsonb,
  2340
);
```

---

## 📊 Example 5: Audit Log Queries

### Query Recent Activity

```sql
SELECT * FROM shq.audit_log_recent
WHERE company_id = '880e8400-e29b-41d4-a716-446655440333'
ORDER BY timestamp DESC
LIMIT 10;
```

### Query by Agent

```sql
SELECT * FROM shq.audit_log
WHERE agent_id = 'SHQ-INTAKE-VALIDATOR'
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### Query Failures

```sql
SELECT * FROM shq.audit_log
WHERE status = 'failure'
  AND timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;
```

### Performance Monitoring

```sql
SELECT
  agent_id,
  process_type,
  COUNT(*) as total_runs,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms
FROM shq.audit_log
WHERE duration_ms IS NOT NULL
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY agent_id, process_type
ORDER BY avg_duration_ms DESC;
```

---

## 📚 Related Documentation

- `CTB_MAP.md` - System architecture overview
- `README_AGENT_STRUCTURE.md` - Agent workflows and validation
- `README-CLIENT-INTAKE.md` - Client intake wizard documentation
- `firebase/model.md` - Firestore data model
- `db/neon/` - Database schema definitions
