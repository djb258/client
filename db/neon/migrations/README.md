# Barton Client Database - Schema Migrations

## Overview

This directory contains migrations for the **Barton Client Database** (`clnt`), implementing a minimal 5-schema architecture with doctrine metadata compliance (STAMPED/SPVPET).

### Database Structure
```
Database: clnt
├── Schema: core         (Identity Backbone)
├── Schema: benefits     (Vendor + Plan References)
├── Schema: compliance   (Rules + State/Federal Layer)
├── Schema: operations   (Audit + Tickets)
└── Schema: staging      (Raw Intake)
```

---

## 📋 Migration Files

| File | Schema | Purpose | Tables |
|------|--------|---------|--------|
| `10_clnt_core_schema.sql` | `core` | Core identity and relationships | 3 tables |
| `11_clnt_benefits_schema.sql` | `benefits` | Vendor linkage and cross-references | 2 tables |
| `12_clnt_compliance_schema.sql` | `compliance` | Compliance rules and regulations | 1 table |
| `13_clnt_operations_schema.sql` | `operations` | Data lineage and audit trails | 1 table |
| `14_clnt_staging_schema.sql` | `staging` | Raw data intake staging | 2 tables |
| `15_clnt_seed_data.sql` | All schemas | Test/development seed data | N/A |

**Total Tables**: 9 functional tables

---

## 🏗️ Schema Descriptions

### 1️⃣ core (Identity Backbone)

**Purpose**: Master identity tables for companies and employees.

**Tables**:
- `core.company_master` - Master company identity records
- `core.employee_master` - Master employee identity records linked to companies
- `core.entity_relationship` - Flexible relationship mapping (company-to-company, employee-to-employee, etc.)

**Key Features**:
- Auto-updating timestamps via triggers
- Cascade delete protection for data integrity
- Doctrine metadata columns on all tables
- Indexed for fast lookups (status, EIN, hire date)

**Sample Queries**:
```sql
-- Get all active companies
SELECT * FROM core.company_master WHERE status = 'active';

-- Get all employees for a specific company
SELECT * FROM core.employee_master WHERE company_uid = 'CLNT-0001';

-- Find manager-employee relationships
SELECT * FROM core.entity_relationship
WHERE relationship_type = 'manager_employee' AND status = 'active';
```

---

### 2️⃣ benefits (Vendor + Plan References)

**Purpose**: Vendor management and employee-vendor ID cross-referencing.

**Tables**:
- `benefits.vendor_link` - Vendor master table with company linkage
- `benefits.employee_vendor_id` - Vendor-specific employee ID cross-reference

**Key Features**:
- Unique constraint on (employee_uid, vendor_id) to prevent duplicates
- Support for multiple vendor types (Carrier, TPA, PBM, Broker)
- Integration type tracking (API, SFTP, Portal, Manual)
- Indexed for fast vendor and employee lookups

**Sample Queries**:
```sql
-- Get all vendors for a company
SELECT * FROM benefits.vendor_link WHERE company_uid = 'CLNT-0001';

-- Get vendor-specific employee ID
SELECT vendor_employee_id
FROM benefits.employee_vendor_id
WHERE employee_uid = 'EMP-0001' AND vendor_id = 'VEND-GUARDIAN';

-- Find all employees with Guardian IDs
SELECT e.first_name, e.last_name, v.vendor_employee_id
FROM core.employee_master e
JOIN benefits.employee_vendor_id v ON e.employee_uid = v.employee_uid
WHERE v.vendor_id = 'VEND-GUARDIAN';
```

---

### 3️⃣ compliance (Rules + State/Federal Layer)

**Purpose**: Store compliance rules, regulations, and requirements.

**Tables**:
- `compliance.compliance_vault` - Compliance rules and regulatory requirements per company

**Key Features**:
- ERISA, ACA, FMLA tracking
- Self-insured status tracking
- JSONB fields for flexible state-specific rules
- Plan year date tracking
- Required forms tracking (Form 5500, 1095-C, etc.)

**Sample Queries**:
```sql
-- Get ERISA-applicable companies
SELECT * FROM compliance.compliance_vault WHERE erisa_applicable = TRUE;

-- Get companies with enhanced FMLA leave
SELECT company_uid, fmla_state_rules
FROM compliance.compliance_vault
WHERE fmla_state_rules->>'enhanced_leave' = 'true';

-- Find companies with plan years ending soon
SELECT company_uid, plan_year_end
FROM compliance.compliance_vault
WHERE plan_year_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months';
```

---

### 4️⃣ operations (Audit + Tickets)

**Purpose**: Track data modifications and lineage for audit trails.

**Tables**:
- `operations.audit_data_lineage` - Data lineage and audit trail tracking

**Key Features**:
- Version hash tracking for data integrity
- Action type tracking (CREATE, UPDATE, DELETE, EXPORT, IMPORT)
- Entity and attribute-level tracking
- Timestamp and user/agent tracking
- Indexed for fast audit queries

**Sample Queries**:
```sql
-- Get all audit records for an entity
SELECT * FROM operations.audit_data_lineage
WHERE entity_uid = 'CLNT-0001'
ORDER BY timestamp_used DESC;

-- Find all CREATE actions
SELECT * FROM operations.audit_data_lineage
WHERE action_type = 'CREATE'
ORDER BY created_at DESC;

-- Track attribute changes over time
SELECT attribute_code, attribute_value, timestamp_used, filled_by
FROM operations.audit_data_lineage
WHERE entity_uid = 'EMP-0001'
ORDER BY timestamp_used DESC;
```

---

### 5️⃣ staging (Raw Intake)

**Purpose**: Temporary storage for raw intake data before validation and processing.

**Tables**:
- `staging.raw_intake_company` - Raw company data staging
- `staging.raw_intake_employee` - Raw employee data staging

**Key Features**:
- JSONB storage for flexible data formats
- Source tracking (UI, API, CSV, Excel, Manual)
- Processing status flag
- Auto-timestamping on creation
- Indexed for fast unprocessed record queries

**Sample Queries**:
```sql
-- Get all unprocessed company records
SELECT * FROM staging.raw_intake_company WHERE processed = FALSE;

-- Get records from UI intake
SELECT * FROM staging.raw_intake_employee WHERE source = 'UI';

-- Mark record as processed
UPDATE staging.raw_intake_company
SET processed = TRUE
WHERE intake_id = 1;
```

---

## 🔧 Installation

### Prerequisites
1. PostgreSQL database named `clnt` must exist
2. Connect to the `clnt` database before running migrations
3. User must have CREATE SCHEMA and CREATE TABLE privileges

### Running Migrations

**Option 1: Run all migrations sequentially**
```bash
psql -d clnt -f 10_clnt_core_schema.sql
psql -d clnt -f 11_clnt_benefits_schema.sql
psql -d clnt -f 12_clnt_compliance_schema.sql
psql -d clnt -f 13_clnt_operations_schema.sql
psql -d clnt -f 14_clnt_staging_schema.sql
psql -d clnt -f 15_clnt_seed_data.sql
```

**Option 2: Run all at once**
```bash
cat 10_*.sql 11_*.sql 12_*.sql 13_*.sql 14_*.sql 15_*.sql | psql -d clnt
```

**Option 3: Using Neon connection string**
```bash
export DATABASE_URL="postgresql://user:pass@host/clnt"
psql $DATABASE_URL -f 10_clnt_core_schema.sql
# ... repeat for each migration
```

---

## ✅ Verification

After running migrations, verify the setup:

```sql
-- Check all schemas exist
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('core', 'benefits', 'compliance', 'operations', 'staging');

-- Count tables in each schema
SELECT
  table_schema,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('core', 'benefits', 'compliance', 'operations', 'staging')
GROUP BY table_schema;

-- Verify seed data
SELECT
  (SELECT COUNT(*) FROM core.company_master) as companies,
  (SELECT COUNT(*) FROM core.employee_master) as employees,
  (SELECT COUNT(*) FROM benefits.vendor_link) as vendors,
  (SELECT COUNT(*) FROM compliance.compliance_vault) as compliance_records,
  (SELECT COUNT(*) FROM operations.audit_data_lineage) as audit_records,
  (SELECT COUNT(*) FROM staging.raw_intake_company WHERE processed = FALSE) as unprocessed_companies,
  (SELECT COUNT(*) FROM staging.raw_intake_employee WHERE processed = FALSE) as unprocessed_employees;
```

Expected results:
- 5 schemas created
- 9 tables total (3 core, 2 benefits, 1 compliance, 1 operations, 2 staging)
- Seed data: 2 companies, 3 employees, 3 vendors, 2 compliance records

---

## 📐 Doctrine Metadata Columns

All tables include these doctrine metadata columns for STAMPED/SPVPET compliance:

| Column | Type | Purpose |
|--------|------|---------|
| `column_number` | INT | Column sequence number for ordering |
| `column_description` | TEXT | Human-readable column description |
| `column_format` | TEXT | Expected format/pattern for validation |

These columns support:
- Data lineage tracking
- Schema versioning
- Validation rule documentation
- Blueprint compliance

---

## 🔄 Auto-Update Triggers

All tables with `updated_at` columns have triggers to automatically update the timestamp on record modification:

```sql
CREATE TRIGGER update_{table_name}_updated_at
    BEFORE UPDATE ON {schema}.{table_name}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

This ensures accurate tracking of data modifications without manual timestamp management.

---

## 🚀 Extensibility

Each schema is designed for independent expansion:

### Adding Tables to Existing Schemas
```sql
-- Example: Add a new table to benefits schema
CREATE TABLE benefits.plan_master (
  plan_id TEXT PRIMARY KEY,
  vendor_id TEXT REFERENCES benefits.vendor_link(vendor_id),
  plan_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  column_number INT,
  column_description TEXT,
  column_format TEXT
);
```

### Adding New Schemas
```sql
-- Example: Add a payroll schema
CREATE SCHEMA IF NOT EXISTS payroll;

CREATE TABLE payroll.payroll_master (
  payroll_id TEXT PRIMARY KEY,
  employee_uid TEXT REFERENCES core.employee_master(employee_uid),
  pay_period_start DATE,
  pay_period_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  column_number INT,
  column_description TEXT,
  column_format TEXT
);
```

**No migration conflicts** - Each schema operates independently.

---

## 📊 Schema Relationships

See the ER diagram below for visual representation of schema relationships.

**Cross-Schema Relationships**:
- `benefits.vendor_link` → `core.company_master` (company linkage)
- `benefits.employee_vendor_id` → `core.employee_master` (employee linkage)
- `benefits.employee_vendor_id` → `benefits.vendor_link` (vendor linkage)
- `compliance.compliance_vault` → `core.company_master` (company compliance rules)

**No circular dependencies** - Schema relationships form a clean directed acyclic graph (DAG).

---

## 📝 Notes

1. **Minimal Footprint**: Only 9 functional tables to start
2. **Scalable**: Each schema can expand independently
3. **Doctrine-Compliant**: All tables include metadata columns
4. **Clear Navigation**: Schema names indicate purpose
5. **Production-Ready**: Includes indexes, triggers, and constraints
6. **Seed Data Included**: Ready for testing immediately after migration

---

## 🔗 Related Documentation

- See `SCHEMA_ER_DIAGRAM.md` for visual schema relationships
- See `/db/neon/01_schema.sql` for legacy schema reference
- See `/README_LLM_OVERVIEW.md` for agent integration documentation

---

**Migration Version**: 1.0.0
**Created**: 2025-10-27
**Database**: clnt
**PostgreSQL Version**: 14+
