# Barton Client Database — API Registry Overview

This registry defines the full data exposure plan for the Barton Client Vault (Neon).

- **Database:** clnt
- **Schemas:** core, benefits, compliance, operations, staging
- **Registry File:** `/sys/api_registry.json`
- **Manifest File:** `/sys/composio-mcp/manifest.json`

---

## Purpose

This documentation prepares the system for automated endpoint generation via Composio MCP and n8n node generation.

**Endpoints are not yet live** — they will be generated automatically once the Validator Agent activates API exposure.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│          Barton Client Database (clnt)              │
│  ┌───────────┬───────────┬────────────┬──────────┐ │
│  │   core    │ benefits  │ compliance │  staging │ │
│  │           │           │            │          │ │
│  │ - company │ - vendor  │ - vault    │ - intake │ │
│  │ - employee│ - emp_id  │            │          │ │
│  └───────────┴───────────┴────────────┴──────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓
            ┌────────────────────────┐
            │   api_registry.json    │
            │  (Schema Metadata)     │
            └────────────────────────┘
                         ↓
            ┌────────────────────────┐
            │  composio-mcp/         │
            │  manifest.json         │
            │  (Endpoint Definitions)│
            └────────────────────────┘
                         ↓
            ┌────────────────────────┐
            │  Validator Agent       │
            │  (Gatekeeper)          │
            └────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                ↓                 ↓
   ┌────────┐      ┌──────────┐     ┌──────────┐
   │  n8n   │      │ Composio │     │Builder.io│
   │        │      │   MCP    │     │Lovable.dev│
   └────────┘      └──────────┘     └──────────┘
```

---

## Schema Registry Structure

### 1. core (Identity Backbone)

**Description:** Master identity schema for companies and employees.

**Tables:**
- `company_master`
  - **Methods:** GET, POST, PATCH
  - **Primary Key:** company_uid
  - **Relations:** employee_master, entity_relationship

- `employee_master`
  - **Methods:** GET, POST, PATCH
  - **Primary Key:** employee_uid
  - **Relations:** company_master, employee_vendor_id

- `entity_relationship`
  - **Methods:** GET, POST
  - **Primary Key:** relationship_id
  - **Relations:** company_master, employee_master

### 2. benefits (Vendor + Plan References)

**Description:** Vendor linkage and plan enrollment tracking.

**Tables:**
- `vendor_link`
  - **Methods:** GET, POST
  - **Primary Key:** vendor_id
  - **Relations:** company_master, employee_vendor_id

- `employee_vendor_id`
  - **Methods:** GET, POST, PATCH
  - **Primary Key:** vendor_emp_uid
  - **Relations:** employee_master, vendor_link

### 3. compliance (Rules + State/Federal Layer)

**Description:** Compliance vault and rule tracking per company and employee.

**Tables:**
- `compliance_vault`
  - **Methods:** GET, POST, PATCH
  - **Primary Key:** compliance_id
  - **Relations:** company_master

### 4. operations (Audit + Tickets)

**Description:** Audit and operational tracking schema.

**Tables:**
- `audit_data_lineage`
  - **Methods:** GET, POST
  - **Primary Key:** lineage_id
  - **Relations:** (none - logs all entities)

### 5. staging (Raw Intake)

**Description:** Raw intake area for data ingestion and validation.

**Tables:**
- `raw_intake_company`
  - **Methods:** GET, POST
  - **Primary Key:** intake_id
  - **Relations:** (none - pre-validation stage)

- `raw_intake_employee`
  - **Methods:** GET, POST
  - **Primary Key:** intake_id
  - **Relations:** (none - pre-validation stage)

---

## Access Control

### Default Mode
**readwrite** - Most services have full read/write access

### Gatekeeper
**validator_agent** - All requests must pass through validation

### Role Permissions

| Service | Permissions | Use Case |
|---------|-------------|----------|
| **n8n** | read, write | Workflow automation, data sync |
| **composio** | read, write | MCP orchestration, tool execution |
| **builder.io** | read | Visual UI components |
| **lovable.dev** | readwrite | Full-stack app generation |
| **firebase** | readwrite | Intake staging layer |

---

## Doctrine Metadata

### Version
**STAMPED-SPVPET-v1.0**

### Validated By
**Barton Validator Agent**

### Enforced Fields
Every table must include:
- `column_number` - Column sequence for ordering
- `column_description` - Human-readable description
- `column_format` - Expected format/pattern

---

## Usage Workflow

### 1. Registration Phase (Current)

```bash
# Files created:
✓ /sys/api_registry.json
✓ /sys/composio-mcp/manifest.json
✓ /sys/api_registry_README.md (this file)

# Status:
- Schemas documented
- Endpoints defined (but inactive)
- No SDK generated yet
```

### 2. Validation Phase (Next)

The Validator Agent will:
1. Read `api_registry.json` to discover tables
2. Verify all tables exist in Neon
3. Check that all enforced doctrine fields are present
4. Validate foreign key relationships match registry

### 3. Activation Phase (Future)

When endpoints are activated:
1. Composio MCP reads `manifest.json`
2. Auto-generates REST endpoints for each path
3. Applies security via `BARTON_GATEKEEPER_KEY`
4. Logs all operations to `operations.audit_data_lineage`

### 4. Integration Phase (Future)

External services connect:
- **n8n:** Creates custom nodes for each endpoint
- **Composio:** Registers tools for LLM agent use
- **Builder.io:** Adds data sources to visual editor
- **Lovable.dev:** Generates full-stack CRUD interfaces

---

## Endpoint Structure

### Base URL Pattern
```
https://api.barton.dev/v1/{schema}/{table}
```

### Examples

**Get all companies:**
```http
GET /v1/core/company_master
Authorization: Bearer {BARTON_GATEKEEPER_KEY}
```

**Get specific employee:**
```http
GET /v1/core/employee_master?employee_uid=EMP-0001
Authorization: Bearer {BARTON_GATEKEEPER_KEY}
```

**Create vendor link:**
```http
POST /v1/benefits/vendor_link
Authorization: Bearer {BARTON_GATEKEEPER_KEY}
Content-Type: application/json

{
  "vendor_id": "VEND-NEWCO",
  "company_uid": "CLNT-0001",
  "vendor_name": "New Vendor LLC",
  "vendor_type": "Carrier"
}
```

**Update compliance record:**
```http
PATCH /v1/compliance/compliance_vault?compliance_id=COMP-0001
Authorization: Bearer {BARTON_GATEKEEPER_KEY}
Content-Type: application/json

{
  "aca_applicable": false,
  "plan_year_end": "2026-12-31"
}
```

---

## Security Model

### Authentication
- **Method:** API Key (Bearer token)
- **Environment Variable:** `BARTON_GATEKEEPER_KEY`
- **Storage:** Stored in Render or Neon environment

### Authorization
- All requests validated by **validator_agent**
- Read operations require `read` permission
- Write operations require `write` permission
- PATCH operations require `readwrite` permission

### Audit Logging
Every API call logs to `operations.audit_data_lineage`:
```json
{
  "entity_uid": "CLNT-0001",
  "attribute_code": "company_name",
  "attribute_value": "Updated Company Name",
  "action_type": "UPDATE",
  "filled_by": "n8n-workflow-123",
  "timestamp_used": "2025-10-27T10:30:00Z"
}
```

---

## Configuration Steps

### 1. Set Environment Variables

**Neon/Render:**
```bash
export BARTON_GATEKEEPER_KEY="your-secure-key-here"
export DATABASE_URL="postgresql://user:pass@host/clnt"
```

**Vercel/Firebase:**
```bash
vercel env add BARTON_GATEKEEPER_KEY
firebase functions:config:set barton.gatekeeper_key="your-secure-key-here"
```

### 2. Validate Registry

```bash
# Run validator agent
npm run agent:validate-registry

# Expected output:
# ✓ All schemas found in database
# ✓ All tables found in schemas
# ✓ All doctrine fields present
# ✓ All foreign keys valid
```

### 3. Activate Endpoints (When Ready)

Edit `/sys/composio-mcp/manifest.json`:
```json
{
  "metadata": {
    "auto_generate_sdk": true,
    "endpoint_status": "active"
  }
}
```

Then run:
```bash
npm run composio:generate-endpoints
```

---

## Integration Examples

### n8n Workflow Node

```javascript
// n8n HTTP Request Node
{
  "method": "GET",
  "url": "https://api.barton.dev/v1/core/company_master",
  "authentication": "headerAuth",
  "headerAuth": {
    "name": "Authorization",
    "value": "Bearer {{$env.BARTON_GATEKEEPER_KEY}}"
  }
}
```

### Composio MCP Tool

```python
# Composio tool definition
{
  "name": "get_company",
  "description": "Fetch company data from Barton Client Database",
  "parameters": {
    "company_uid": {
      "type": "string",
      "description": "Unique company identifier (e.g., CLNT-0001)"
    }
  },
  "endpoint": "/v1/core/company_master"
}
```

### Builder.io Data Source

```javascript
// Builder.io external data source
{
  "name": "Barton Companies",
  "type": "rest",
  "url": "https://api.barton.dev/v1/core/company_master",
  "headers": {
    "Authorization": "Bearer {api_key}"
  }
}
```

### Lovable.dev API Integration

```typescript
// Auto-generated Lovable.dev API client
import { BartonClient } from './generated/barton-client';

const client = new BartonClient({
  apiKey: process.env.BARTON_GATEKEEPER_KEY
});

const companies = await client.core.companyMaster.list();
const employee = await client.core.employeeMaster.get('EMP-0001');
```

---

## Next Steps

- [ ] Configure `BARTON_GATEKEEPER_KEY` in Render or Neon
- [ ] Run database migrations (migrations 10-15)
- [ ] Validate all tables with the Validator Agent
- [ ] Test registry structure with sample queries
- [ ] Set `"auto_generate_sdk": true` once endpoint stability is confirmed
- [ ] Generate n8n custom nodes
- [ ] Configure Builder.io data sources
- [ ] Test Lovable.dev integration

---

## File Locations

```
client/
├── sys/
│   ├── api_registry.json           ← Schema registry (this is the source of truth)
│   ├── api_registry_README.md      ← This documentation
│   └── composio-mcp/
│       └── manifest.json           ← Endpoint definitions for Composio
├── db/
│   └── neon/
│       └── migrations/             ← Database schemas (10-15)
└── scripts/
    └── validate_registry.ts        ← Validation script (to be created)
```

---

## Version Control

All files should be committed to version control:

```bash
git add sys/api_registry.json
git add sys/composio-mcp/manifest.json
git add sys/api_registry_README.md
git commit -m "feat: add API registry and Composio manifest scaffolding"
```

---

## Troubleshooting

### Issue: Validator Agent can't find tables

**Solution:** Ensure migrations 10-15 have been applied to the `clnt` database:
```bash
psql -d clnt -f db/neon/migrations/10_clnt_core_schema.sql
# ... run all migrations
```

### Issue: Foreign key validation fails

**Solution:** Check that all `relations` in `api_registry.json` match actual foreign keys in the database schema.

### Issue: Endpoint generation fails

**Solution:** Verify `BARTON_GATEKEEPER_KEY` is set and `manifest.json` has valid JSON syntax:
```bash
echo $BARTON_GATEKEEPER_KEY
cat sys/composio-mcp/manifest.json | jq .
```

---

## Related Documentation

- Database Schema Documentation: `/db/neon/migrations/README.md`
- ER Diagrams: `/db/neon/migrations/SCHEMA_ER_DIAGRAM.md`
- LLM Agent Overview: `/README_LLM_OVERVIEW.md`
- Bootstrap Configuration: `/bootstrap_program.json`

---

**Registry Version:** 1.0.0
**Created:** 2025-10-27
**Status:** Scaffolding Complete (Endpoints Inactive)
**Database:** clnt
**Doctrine:** STAMPED-SPVPET-v1.0
