# Barton API Validation & Testing Guide

## Overview

This guide covers the complete validation and testing workflow for the Barton Client Database API layer. All operations are metadata-only and non-destructive - no live endpoints are activated during this process.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Validation Workflow](#validation-workflow)
3. [Running the Validator Script](#running-the-validator-script)
4. [n8n Workflow Setup](#n8n-workflow-setup)
5. [Running Endpoint Tests](#running-endpoint-tests)
6. [Troubleshooting](#troubleshooting)
7. [Activation Checklist](#activation-checklist)

---

## Prerequisites

### Required Environment Variables

```bash
# Neon PostgreSQL connection
export NEON_URL="postgresql://user:password@host/clnt"
# OR
export DATABASE_URL="postgresql://user:password@host/clnt"

# Composio MCP endpoint (for n8n workflows)
export COMPOSIO_URL="https://api.composio.dev/v1"

# Gatekeeper API key (for future endpoint activation)
export BARTON_GATEKEEPER_KEY="your-secure-api-key-here"
```

### Required Software

- **Node.js** 18+ with npm
- **PostgreSQL** client (psql)
- **n8n** (for workflow testing)
- **Jest** (installed via npm)

### Database Setup

Ensure all migrations have been applied:

```bash
psql -d clnt -f db/neon/migrations/10_clnt_core_schema.sql
psql -d clnt -f db/neon/migrations/11_clnt_benefits_schema.sql
psql -d clnt -f db/neon/migrations/12_clnt_compliance_schema.sql
psql -d clnt -f db/neon/migrations/13_clnt_operations_schema.sql
psql -d clnt -f db/neon/migrations/14_clnt_staging_schema.sql
psql -d clnt -f db/neon/migrations/15_clnt_seed_data.sql
```

---

## Validation Workflow

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Schema Validation                              │
│  → node scripts/validate_api_registry.js                │
│  ✓ Confirms tables exist                                │
│  ✓ Verifies primary keys                                │
│  ✓ Checks doctrine metadata                             │
│  ✓ Validates foreign keys                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Contract Testing                               │
│  → npm test                                              │
│  ✓ Validates registry structure                         │
│  ✓ Checks manifest consistency                          │
│  ✓ Verifies doctrine compliance                         │
│  ✓ Tests access control config                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: n8n Workflow Testing (Optional)                │
│  → Import workflows into n8n                             │
│  → Test company intake flow                              │
│  → Test compliance pull flow                             │
│  ✓ Validates end-to-end data flow                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 4: Activation (When Ready)                        │
│  → Set endpoint_status: "active"                         │
│  → Deploy to production                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Step 1: Running the Validator Script

### Purpose

The validator script (`scripts/validate_api_registry.js`) performs comprehensive checks to ensure the API registry matches the actual database schema.

### What It Checks

✅ Database connectivity
✅ All schemas exist (core, benefits, compliance, operations, staging)
✅ All tables exist in their respective schemas
✅ Primary keys match registry definitions
✅ Foreign key relationships are valid
✅ Doctrine metadata columns are present (`column_number`, `column_description`, `column_format`)

### Running the Validator

```bash
# From project root
npm run agent:validate-registry

# OR directly with Node
node scripts/validate_api_registry.js
```

### Expected Output

```
🔍 Validating Barton API Registry...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Loaded registry: ./sys/api_registry.json
✅ Connected to database: clnt

📂 Schema: core
   Description: Master identity schema for companies and employees.
   ✅ company_master - Found
      ✅ Primary key 'company_uid' - Verified
      ✅ All doctrine fields present
      ✅ Relation 'employee_master' - Valid FK
   ✅ employee_master - Found
      ✅ Primary key 'employee_uid' - Verified
      ✅ All doctrine fields present
      ✅ Relation 'company_master' - Valid FK
   ✅ entity_relationship - Found
      ✅ Primary key 'relationship_id' - Verified
      ✅ All doctrine fields present

📂 Schema: benefits
   Description: Vendor linkage and plan enrollment tracking.
   ✅ vendor_link - Found
      ✅ Primary key 'vendor_id' - Verified
      ✅ All doctrine fields present
   ✅ employee_vendor_id - Found
      ✅ Primary key 'vendor_emp_uid' - Verified
      ✅ All doctrine fields present

📂 Schema: compliance
   Description: Compliance vault and rule tracking per company and employee.
   ✅ compliance_vault - Found
      ✅ Primary key 'compliance_id' - Verified
      ✅ All doctrine fields present

📂 Schema: operations
   Description: Audit and operational tracking schema.
   ✅ audit_data_lineage - Found
      ✅ Primary key 'lineage_id' - Verified
      ✅ All doctrine fields present

📂 Schema: staging
   Description: Raw intake area for data ingestion and validation.
   ✅ raw_intake_company - Found
      ✅ Primary key 'intake_id' - Verified
      ✅ All doctrine fields present
   ✅ raw_intake_employee - Found
      ✅ Primary key 'intake_id' - Verified
      ✅ All doctrine fields present

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VALIDATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Schemas checked:  5
   Tables checked:   9
   Errors found:     0
   Warnings found:   0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Registry validation successful. All tables found.
✅ All primary keys verified.
✅ All doctrine fields present.
✅ All foreign key relationships valid.

📌 Next steps:
   1. Set 'endpoint_status': 'active' in manifest.json
   2. Deploy Composio MCP endpoints
   3. Run endpoint tests: npm run test
```

### Handling Errors

If validation fails, you'll see specific error messages:

```
❌ ERRORS:
   1. Missing table: core.company_master
   2. Primary key mismatch in benefits.vendor_link: expected 'vendor_id' not found
   3. Missing doctrine field 'column_number' in staging.raw_intake_company
```

**Resolution:**
- Ensure all migrations have been run
- Check table names match exactly (case-sensitive)
- Verify doctrine metadata columns exist in all tables

---

## 🧩 Step 2: n8n Workflow Setup

### Available Workflows

1. **Company Intake Flow** (`n8n/workflows/company_intake_flow.json`)
   - Receives company data via webhook
   - Inserts into `staging.raw_intake_company`
   - Triggers validator agent
   - Promotes to `core.company_master` if valid
   - Logs all operations to `operations.audit_data_lineage`

2. **Compliance Pull Flow** (`n8n/workflows/compliance_pull_flow.json`)
   - Queries compliance data for a company
   - Returns compliance vault records
   - Logs data access to audit trail

### Importing Workflows

1. Open n8n interface
2. Click **Workflows** → **Import from File**
3. Select `n8n/workflows/company_intake_flow.json`
4. Configure PostgreSQL credentials:
   - **Host:** Your Neon host
   - **Database:** clnt
   - **User:** Your database user
   - **Password:** Your database password
5. Activate the workflow

### Testing Company Intake Flow

**Step 1: Get webhook URL**
```
Webhook URL: https://your-n8n-instance.com/webhook/intake/company
```

**Step 2: Send test payload**
```bash
curl -X POST https://your-n8n-instance.com/webhook/intake/company \
  -H "Content-Type: application/json" \
  -d '{
    "company_uid": "CLNT-TEST-001",
    "company_name": "Test Company LLC",
    "ein": "12-3456789"
  }'
```

**Step 3: Verify data insertion**
```sql
-- Check staging table
SELECT * FROM staging.raw_intake_company
WHERE raw_data->>'company_uid' = 'CLNT-TEST-001';

-- Check core table (if promoted)
SELECT * FROM core.company_master
WHERE company_uid = 'CLNT-TEST-001';

-- Check audit log
SELECT * FROM operations.audit_data_lineage
WHERE entity_uid = 'CLNT-TEST-001';
```

**Expected Response:**
```json
{
  "success": true,
  "company_uid": "CLNT-TEST-001",
  "intake_id": 123,
  "message": "Company intake successful"
}
```

### Testing Compliance Pull Flow

**Step 1: Get webhook URL**
```
Webhook URL: https://your-n8n-instance.com/webhook/compliance/pull
```

**Step 2: Send test request**
```bash
curl -X POST https://your-n8n-instance.com/webhook/compliance/pull \
  -H "Content-Type: application/json" \
  -d '{
    "company_uid": "CLNT-0001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "compliance_id": "COMP-0001",
      "company_uid": "CLNT-0001",
      "company_name": "Acme Benefits LLC",
      "self_insured": true,
      "erisa_applicable": true,
      "aca_applicable": true,
      "plan_year_start": "2025-01-01",
      "plan_year_end": "2025-12-31"
    }
  ],
  "count": 1
}
```

---

## 🧩 Step 3: Running Endpoint Tests

### Test Suite Overview

The test suite (`tests/api_endpoint_contract.test.js`) contains 50+ tests covering:

- ✅ Registry file structure and validity
- ✅ Manifest file structure and validity
- ✅ Registry/manifest consistency
- ✅ Doctrine metadata compliance
- ✅ Access control configuration
- ✅ Schema validation
- ✅ Edge cases and error handling

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- api_endpoint_contract.test.js
```

### Expected Output

```
PASS  tests/api_endpoint_contract.test.js
  API Registry Structure
    ✓ Registry file exists and is valid JSON (3 ms)
    ✓ Registry has required top-level properties (1 ms)
    ✓ Registry database is 'clnt' (1 ms)
    ✓ Registry has all 5 schemas (1 ms)
    ✓ Each schema has description and tables (2 ms)
    ✓ Each table has required properties (3 ms)
  Composio Manifest Structure
    ✓ Manifest file exists and is valid JSON (1 ms)
    ✓ Manifest has required top-level properties (1 ms)
    ✓ Manifest name is 'barton-client-database' (1 ms)
    ✓ Manifest endpoints is an array (1 ms)
    ✓ Each endpoint has required properties (2 ms)
    ✓ Endpoint methods are valid HTTP methods (1 ms)
    ✓ Endpoint auth is valid (1 ms)
    ✓ Manifest security has required properties (1 ms)
    ✓ Manifest metadata has required properties (1 ms)
    ✓ Endpoints are initially inactive (1 ms)
    ✓ SDK auto-generation is initially disabled (1 ms)
  Registry and Manifest Consistency
    ✓ Registry and manifest table counts match (2 ms)
    ✓ All registry tables have corresponding manifest endpoints (2 ms)
    ✓ All manifest endpoints reference existing registry tables (2 ms)
    ✓ Endpoint methods match registry table methods (2 ms)
  Doctrine Metadata Compliance
    ✓ Doctrine metadata version is present (1 ms)
    ✓ Doctrine metadata has validator (1 ms)
    ✓ Doctrine enforced fields are defined (1 ms)
    ✓ Manifest doctrine matches registry (1 ms)
    ✓ Manifest validator agent is defined (1 ms)
  Access Control Configuration
    ✓ Access control has required properties (1 ms)
    ✓ Default mode is readwrite (1 ms)
    ✓ Gatekeeper is validator_agent (1 ms)
    ✓ All expected integration roles are defined (1 ms)
    ✓ Role permissions are valid (2 ms)
  Schema Validation
    ✓ Core schema has 3 tables (1 ms)
    ✓ Benefits schema has 2 tables (1 ms)
    ✓ Compliance schema has 1 table (1 ms)
    ✓ Operations schema has 1 table (1 ms)
    ✓ Staging schema has 2 tables (1 ms)
    ✓ Total table count is 9 (1 ms)
  Edge Cases and Error Handling
    ✓ No duplicate table names across schemas (2 ms)
    ✓ No duplicate endpoint paths in manifest (1 ms)
    ✓ All primary keys are non-empty arrays (2 ms)

Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        1.234 s
```

### Test Failures

If tests fail, you'll see detailed error messages:

```
FAIL  tests/api_endpoint_contract.test.js
  Registry and Manifest Consistency
    ✕ All registry tables have corresponding manifest endpoints (5 ms)

  ● Registry and Manifest Consistency › All registry tables have corresponding manifest endpoints

    expect(received).toContain(expected)

    Expected: "compliance.employee_compliance_state"
    Received: [
      "core.company_master",
      "core.employee_master",
      "benefits.vendor_link",
      "compliance.compliance_vault"
    ]
```

**Resolution:** Add missing endpoint to `sys/composio-mcp/manifest.json`

---

## 🛠️ Troubleshooting

### Database Connection Issues

**Error:** `Database connection failed: connection refused`

**Solutions:**
- Verify `NEON_URL` or `DATABASE_URL` is set correctly
- Check Neon database is online
- Verify IP whitelist in Neon settings
- Test connection with psql:
  ```bash
  psql $NEON_URL -c "SELECT current_database();"
  ```

### Missing Tables

**Error:** `Missing table: core.company_master`

**Solutions:**
- Run migrations in order (10-15)
- Verify you're connected to the `clnt` database
- Check schema exists:
  ```sql
  SELECT schema_name FROM information_schema.schemata
  WHERE schema_name = 'core';
  ```

### Primary Key Mismatches

**Error:** `Primary key mismatch in benefits.vendor_link: expected 'vendor_id' not found`

**Solutions:**
- Check table definition matches migration
- Verify primary key constraint exists:
  ```sql
  SELECT a.attname
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid
  WHERE i.indrelid = 'benefits.vendor_link'::regclass
  AND i.indisprimary;
  ```

### Doctrine Fields Missing

**Error:** `Missing doctrine field 'column_number' in staging.raw_intake_company`

**Solutions:**
- Re-run migration for that schema
- Manually add missing columns:
  ```sql
  ALTER TABLE staging.raw_intake_company
  ADD COLUMN column_number INT,
  ADD COLUMN column_description TEXT,
  ADD COLUMN column_format TEXT;
  ```

### n8n Workflow Errors

**Error:** `PostgreSQL node: relation "clnt.staging.raw_intake_company" does not exist`

**Solutions:**
- Check n8n PostgreSQL connection uses database `clnt`
- Verify table names use schema prefix (`staging.raw_intake_company`)
- Test query directly in PostgreSQL node

---

## ✅ Activation Checklist

Before activating live endpoints, ensure all checks pass:

### Pre-Activation Validation

- [ ] ✅ All schemas exist in database (5 schemas)
- [ ] ✅ All tables exist in database (9 tables)
- [ ] ✅ All primary keys verified
- [ ] ✅ All foreign keys validated
- [ ] ✅ All doctrine metadata columns present
- [ ] ✅ Registry validation script passes with 0 errors
- [ ] ✅ Jest test suite passes (39/39 tests)
- [ ] ✅ n8n workflows tested successfully (optional)

### Security Configuration

- [ ] ✅ `BARTON_GATEKEEPER_KEY` environment variable set
- [ ] ✅ API key stored securely (not in version control)
- [ ] ✅ Neon IP whitelist configured
- [ ] ✅ Validator agent credentials configured

### Manifest Configuration

- [ ] ✅ Update `sys/composio-mcp/manifest.json`:
  ```json
  {
    "metadata": {
      "auto_generate_sdk": true,
      "endpoint_status": "active"
    }
  }
  ```

### Deployment

- [ ] ✅ Commit all changes to git
- [ ] ✅ Push to main branch
- [ ] ✅ Deploy to Render/Vercel/production
- [ ] ✅ Verify endpoints are accessible
- [ ] ✅ Test first API call manually
- [ ] ✅ Monitor audit logs for activity

---

## 📊 Validation Summary

| Layer | File | Purpose | Command |
|-------|------|---------|---------|
| **Validation** | `/scripts/validate_api_registry.js` | Confirms database-schema sync | `npm run agent:validate-registry` |
| **Workflow** | `/n8n/workflows/company_intake_flow.json` | Example pipeline: intake → validation → audit | Import into n8n |
| **Workflow** | `/n8n/workflows/compliance_pull_flow.json` | Example compliance data retrieval | Import into n8n |
| **Testing** | `/tests/api_endpoint_contract.test.js` | Ensures registry ↔ manifest consistency | `npm test` |

---

## 🎯 Next Steps After Validation

1. **Review Results**
   - Check validator output for warnings
   - Ensure all tests pass
   - Verify n8n workflows complete successfully

2. **Documentation**
   - Update README with validation results
   - Document any edge cases discovered
   - Note performance benchmarks

3. **Activate Endpoints** (when ready)
   - Set `endpoint_status: "active"` in manifest
   - Deploy Composio MCP server
   - Monitor initial API traffic

4. **Integration**
   - Connect n8n workflows to production endpoints
   - Configure Builder.io data sources
   - Set up Lovable.dev integration
   - Enable Firebase sync

---

## 📚 Related Documentation

- [API Registry README](../sys/api_registry_README.md) - Complete API documentation
- [Schema Migrations](../db/neon/migrations/README.md) - Database schema guide
- [ER Diagrams](../db/neon/migrations/SCHEMA_ER_DIAGRAM.md) - Visual schema relationships
- [LLM Overview](../README_LLM_OVERVIEW.md) - Agent integration guide

---

**Guide Version:** 1.0.0
**Created:** 2025-10-27
**Status:** Metadata-Only (No Live Endpoints)
**Database:** clnt
**Doctrine:** STAMPED-SPVPET-v1.0
