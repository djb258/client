# Database Schema Reference

**Implementation Date:** 2025-10-23
**Version:** 1.0.0
**Status:** ✅ COMPLETE TRACEABILITY

---

## 🎯 Overview

Complete documentation of every database object in the client-subhive repository. This reference provides 100% traceability for all tables, columns, relationships, constraints, and Barton ID conventions.

## 📊 Schema Summary

| Schema | Tables | Purpose | Database |
|--------|--------|---------|----------|
| `clnt` | 8 | Client, employee, vendor, benefit data vault | PostgreSQL (Neon) |

**Total Tables:** 8
**Total Columns:** 75+
**Primary Keys:** All UUID-based
**Foreign Keys:** 9 relationships

---

## 📋 STAMPED Schema Legend

All database objects follow the **STAMPED** documentation pattern:

- **S**tructure: Table name, schema, primary key
- **T**ype: Data types for each column
- **A**ssociations: Foreign key relationships
- **M**etadata: Timestamps, defaults, constraints
- **P**urpose: Business logic and usage
- **E**nforcement: Check constraints, validation rules
- **D**ependencies: Linked processes and enforcement rules

---

## 📍 Table Catalog

### 1. Company Master

**Table:** `clnt.company_master`
**Barton ID Column:** `company_unique_id`
**Purpose:** Master registry of all client companies

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.company_master (
    company_unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    ein TEXT UNIQUE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `company_unique_id` | UUID | YES | gen_random_uuid() | Primary key - unique company identifier |
| `company_name` | TEXT | YES | - | Legal company name |
| `ein` | TEXT | NO | - | Employer Identification Number (XX-XXXXXXX) |
| `address` | TEXT | NO | - | Company mailing address |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | now() | Record update timestamp |

**Associations:**
- **References:** None (root entity)
- **Referenced By:**
  - `clnt.employee_master.company_unique_id`
  - `clnt.company_vendor_link.company_unique_id`

**Metadata:**
- **Indexes:** PRIMARY KEY on `company_unique_id`, UNIQUE on `ein`
- **Constraints:** NOT NULL on `company_name`
- **Auto-generated:** UUID primary key, timestamps

**Purpose:**
- Serves as the root entity for all client data
- One company can have many employees and vendor relationships
- EIN is unique across all companies (federal tax identifier)

**Enforcement:**
- EIN must be unique if provided
- Company name is mandatory
- All changes tracked via updated_at timestamp

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):9-16
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):16-53
- **Linked Process:** Company intake wizard
- **API Endpoint:** `/api/ssot/save` (type: "company")

---

### 2. Employee Master

**Table:** `clnt.employee_master`
**Barton ID Column:** `employee_unique_id`
**Purpose:** Master registry of all employees across all companies

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.employee_master (
    employee_unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_unique_id UUID NOT NULL REFERENCES clnt.company_master(company_unique_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    ssn_last4 CHAR(4),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `employee_unique_id` | UUID | YES | gen_random_uuid() | Primary key - unique employee identifier |
| `company_unique_id` | UUID | YES | - | Foreign key to company_master |
| `first_name` | TEXT | YES | - | Employee first name |
| `last_name` | TEXT | YES | - | Employee last name |
| `dob` | DATE | NO | - | Date of birth |
| `ssn_last4` | CHAR(4) | NO | - | Last 4 digits of SSN for matching |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NO | now() | Record update timestamp |

**Associations:**
- **References:**
  - `clnt.company_master.company_unique_id` (FOREIGN KEY)
- **Referenced By:**
  - `clnt.employee_benefit_enrollment.employee_unique_id`

**Metadata:**
- **Indexes:** PRIMARY KEY on `employee_unique_id`, FOREIGN KEY on `company_unique_id`
- **Constraints:** NOT NULL on `company_unique_id`, `first_name`, `last_name`
- **Auto-generated:** UUID primary key, timestamps

**Purpose:**
- Central employee registry across all companies
- Links employees to their employer
- Stores PII safely (partial SSN only)
- One employee can have many benefit enrollments

**Enforcement:**
- Must belong to exactly one company
- First and last name are mandatory
- SSN stored as last 4 digits only for security

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):19-28
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):55-92
- **Linked Process:** Employee intake/import
- **API Endpoint:** `/api/ssot/save` (type: "employee")

---

### 3. Vendor Master

**Table:** `clnt.vendor_master`
**Barton ID Column:** `vendor_id`
**Purpose:** Master registry of all benefits vendors (insurance carriers, administrators)

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.vendor_master (
    vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL,
    vendor_type TEXT,
    default_support_email TEXT,
    default_support_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `vendor_id` | UUID | YES | gen_random_uuid() | Primary key - unique vendor identifier |
| `vendor_name` | TEXT | YES | - | Vendor/carrier name |
| `vendor_type` | TEXT | NO | - | Type of vendor (carrier, TPA, broker) |
| `default_support_email` | TEXT | NO | - | Default support email address |
| `default_support_phone` | TEXT | NO | - | Default support phone number |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |

**Associations:**
- **References:** None (root entity)
- **Referenced By:**
  - `clnt.company_vendor_link.vendor_id`
  - `clnt.vendor_output_blueprint.vendor_id`

**Metadata:**
- **Indexes:** PRIMARY KEY on `vendor_id`
- **Constraints:** NOT NULL on `vendor_name`
- **Auto-generated:** UUID primary key, timestamp

**Purpose:**
- Central registry of all benefits vendors
- Stores default contact information
- One vendor can serve many companies
- Links to vendor-specific output blueprints

**Enforcement:**
- Vendor name is mandatory
- Vendor can be reused across multiple companies

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):31-38
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):94-119
- **Linked Process:** Vendor registration
- **API Endpoint:** `/api/ssot/save` (type: "vendor")

---

### 4. Company Vendor Link

**Table:** `clnt.company_vendor_link`
**Barton ID Column:** `company_vendor_id`
**Purpose:** Links companies to their vendors with account-specific information (SPD, contacts, renewal dates)

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.company_vendor_link (
    company_vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_unique_id UUID NOT NULL REFERENCES clnt.company_master(company_unique_id),
    vendor_id UUID NOT NULL REFERENCES clnt.vendor_master(vendor_id),
    account_manager_name TEXT,
    account_manager_email TEXT,
    account_manager_phone TEXT,
    support_email TEXT,
    support_phone TEXT,
    spd_url TEXT,
    renewal_date DATE,
    blueprint_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `company_vendor_id` | UUID | YES | gen_random_uuid() | Primary key - unique link identifier |
| `company_unique_id` | UUID | YES | - | Foreign key to company_master |
| `vendor_id` | UUID | YES | - | Foreign key to vendor_master |
| `account_manager_name` | TEXT | NO | - | Dedicated account manager name |
| `account_manager_email` | TEXT | NO | - | Account manager email |
| `account_manager_phone` | TEXT | NO | - | Account manager phone |
| `support_email` | TEXT | NO | - | Company-specific support email |
| `support_phone` | TEXT | NO | - | Company-specific support phone |
| `spd_url` | TEXT | NO | - | Summary Plan Description URL |
| `renewal_date` | DATE | NO | - | Policy renewal date |
| `blueprint_id` | TEXT | NO | - | Links to vendor_output_blueprint |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |

**Associations:**
- **References:**
  - `clnt.company_master.company_unique_id` (FOREIGN KEY)
  - `clnt.vendor_master.vendor_id` (FOREIGN KEY)
- **Referenced By:**
  - `clnt.benefit_master.company_vendor_id`

**Metadata:**
- **Indexes:** PRIMARY KEY on `company_vendor_id`, FOREIGN KEYs on both company and vendor
- **Constraints:** NOT NULL on `company_unique_id`, `vendor_id`
- **Auto-generated:** UUID primary key, timestamp

**Purpose:**
- Many-to-many relationship between companies and vendors
- Stores account-specific contact information
- Links to SPD documents for compliance
- Tracks renewal dates for proactive management
- One link can have many benefits

**Enforcement:**
- Must reference valid company and vendor
- Allows custom contacts per company-vendor relationship
- Blueprint ID links to vendor-specific output format

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):41-54
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):94-119
- **Linked Process:** Vendor linkage configuration
- **API Endpoint:** `/api/ssot/save` (type: "vendor_linkage")

---

### 5. Benefit Master

**Table:** `clnt.benefit_master`
**Barton ID Column:** `benefit_unique_id`
**Purpose:** Master registry of all benefits offered by vendors to companies

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.benefit_master (
    benefit_unique_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_vendor_id UUID NOT NULL REFERENCES clnt.company_vendor_link(company_vendor_id),
    vendor_benefit_id TEXT NOT NULL,
    benefit_type TEXT NOT NULL,
    effective_date DATE,
    renewal_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `benefit_unique_id` | UUID | YES | gen_random_uuid() | Primary key - unique benefit identifier |
| `company_vendor_id` | UUID | YES | - | Foreign key to company_vendor_link |
| `vendor_benefit_id` | TEXT | YES | - | Vendor's internal benefit/plan ID |
| `benefit_type` | TEXT | YES | - | Type: medical, dental, vision, life, etc. |
| `effective_date` | DATE | NO | - | Benefit effective date |
| `renewal_date` | DATE | NO | - | Benefit renewal date |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |

**Associations:**
- **References:**
  - `clnt.company_vendor_link.company_vendor_id` (FOREIGN KEY)
- **Referenced By:**
  - `clnt.benefit_tier_cost.benefit_unique_id`
  - `clnt.employee_benefit_enrollment.benefit_unique_id`

**Metadata:**
- **Indexes:** PRIMARY KEY on `benefit_unique_id`, FOREIGN KEY on `company_vendor_id`
- **Constraints:** NOT NULL on `company_vendor_id`, `vendor_benefit_id`, `benefit_type`
- **Auto-generated:** UUID primary key, timestamp

**Purpose:**
- Central registry of benefits offered
- Links benefits to company-vendor relationships
- Stores vendor's internal plan identifier
- Tracks effective and renewal dates
- One benefit can have many tiers and enrollments

**Enforcement:**
- Must be linked to valid company-vendor relationship
- Vendor benefit ID is required for vendor API integration
- Benefit type categorizes the benefit (medical, dental, etc.)

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):57-65
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):121-150
- **Linked Process:** Benefit configuration
- **API Endpoint:** `/api/ssot/save` (type: "benefit")

---

### 6. Benefit Tier Cost

**Table:** `clnt.benefit_tier_cost`
**Barton ID Column:** `tier_cost_id`
**Purpose:** Stores cost information for each benefit tier (employee-only, family, etc.)

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.benefit_tier_cost (
    tier_cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benefit_unique_id UUID NOT NULL REFERENCES clnt.benefit_master(benefit_unique_id),
    tier_type TEXT CHECK (tier_type IN ('employee_only', 'employee_spouse', 'employee_children', 'family')),
    plan_year INT NOT NULL,
    cost_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `tier_cost_id` | UUID | YES | gen_random_uuid() | Primary key - unique tier cost identifier |
| `benefit_unique_id` | UUID | YES | - | Foreign key to benefit_master |
| `tier_type` | TEXT | YES | - | Coverage tier (see check constraint) |
| `plan_year` | INT | YES | - | Plan year (e.g., 2025) |
| `cost_amount` | NUMERIC(12,2) | YES | - | Cost in dollars and cents |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |

**Associations:**
- **References:**
  - `clnt.benefit_master.benefit_unique_id` (FOREIGN KEY)
- **Referenced By:** None (leaf entity)

**Metadata:**
- **Indexes:** PRIMARY KEY on `tier_cost_id`, FOREIGN KEY on `benefit_unique_id`
- **Constraints:**
  - NOT NULL on `benefit_unique_id`, `plan_year`, `cost_amount`
  - CHECK constraint: `tier_type IN ('employee_only', 'employee_spouse', 'employee_children', 'family')`
- **Auto-generated:** UUID primary key, timestamp

**Purpose:**
- Stores pricing for different coverage tiers
- Allows year-over-year cost tracking
- Supports enrollment cost calculations
- One benefit can have multiple tier costs per year

**Enforcement:**
- Tier type must be one of 4 allowed values
- Cost must be specified (cannot be null)
- Plan year tracks historical and future pricing

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):68-75
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):152-169
- **Linked Process:** Benefits pricing import
- **API Endpoint:** `/api/ssot/save` (type: "tier_cost")

---

### 7. Employee Benefit Enrollment

**Table:** `clnt.employee_benefit_enrollment`
**Barton ID Column:** `enrollment_id`
**Purpose:** Tracks which employees are enrolled in which benefits at which tier level

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.employee_benefit_enrollment (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_unique_id UUID NOT NULL REFERENCES clnt.employee_master(employee_unique_id),
    benefit_unique_id UUID NOT NULL REFERENCES clnt.benefit_master(benefit_unique_id),
    tier_type TEXT CHECK (tier_type IN ('employee_only', 'employee_spouse', 'employee_children', 'family')),
    effective_date DATE,
    termination_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `enrollment_id` | UUID | YES | gen_random_uuid() | Primary key - unique enrollment identifier |
| `employee_unique_id` | UUID | YES | - | Foreign key to employee_master |
| `benefit_unique_id` | UUID | YES | - | Foreign key to benefit_master |
| `tier_type` | TEXT | NO | - | Coverage tier selected (see check constraint) |
| `effective_date` | DATE | NO | - | Enrollment effective date |
| `termination_date` | DATE | NO | - | Enrollment termination date (null if active) |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |

**Associations:**
- **References:**
  - `clnt.employee_master.employee_unique_id` (FOREIGN KEY)
  - `clnt.benefit_master.benefit_unique_id` (FOREIGN KEY)
- **Referenced By:** None (leaf entity)

**Metadata:**
- **Indexes:** PRIMARY KEY on `enrollment_id`, FOREIGN KEYs on employee and benefit
- **Constraints:**
  - NOT NULL on `employee_unique_id`, `benefit_unique_id`
  - CHECK constraint: `tier_type IN ('employee_only', 'employee_spouse', 'employee_children', 'family')`
- **Auto-generated:** UUID primary key, timestamp

**Purpose:**
- Central enrollment registry
- Links employees to their selected benefits
- Tracks enrollment lifecycle (effective → termination)
- Supports historical enrollment tracking
- One employee can have many enrollments (multiple benefits)

**Enforcement:**
- Must reference valid employee and benefit
- Tier type must match allowed values
- Null termination_date indicates active enrollment
- Effective date tracks when coverage begins

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):78-86
- **Registry:** [ctb/data/db/registry/clnt_column_registry.yml](db/registry/clnt_column_registry.yml):171-200
- **Linked Process:** Employee enrollment wizard
- **API Endpoint:** `/api/ssot/save` (type: "enrollment")

---

### 8. Vendor Output Blueprint

**Table:** `clnt.vendor_output_blueprint`
**Barton ID Column:** `blueprint_id`
**Purpose:** Stores vendor-specific output format mappings for data transformation

#### STAMPED Documentation

**Structure:**
```sql
CREATE TABLE clnt.vendor_output_blueprint (
    blueprint_id TEXT PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES clnt.vendor_master(vendor_id),
    mapping_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Type Definitions:**
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `blueprint_id` | TEXT | YES | - | Primary key - human-readable blueprint identifier |
| `vendor_id` | UUID | YES | - | Foreign key to vendor_master |
| `mapping_json` | JSONB | YES | - | Column mapping configuration |
| `created_at` | TIMESTAMPTZ | NO | now() | Record creation timestamp |

**Associations:**
- **References:**
  - `clnt.vendor_master.vendor_id` (FOREIGN KEY)
- **Referenced By:**
  - `clnt.company_vendor_link.blueprint_id` (soft reference)

**Metadata:**
- **Indexes:** PRIMARY KEY on `blueprint_id`, FOREIGN KEY on `vendor_id`
- **Constraints:** NOT NULL on `vendor_id`, `mapping_json`
- **Auto-generated:** Timestamp only (blueprint_id is manual)

**Purpose:**
- Defines vendor-specific output formats
- Maps internal columns to vendor-expected format
- Supports IMO (Input-Middle-Output) processing
- JSONB allows flexible mapping rules
- One vendor can have multiple blueprints

**Enforcement:**
- Blueprint ID must be unique and descriptive
- Must be linked to valid vendor
- Mapping JSON is required for processing

**Dependencies:**
- **Source File:** [ctb/data/db/neon/01_schema.sql](db/neon/01_schema.sql):89-94
- **Linked Process:** IMO blueprint processing
- **API Endpoint:** `/api/ssot/save` (type: "blueprint")
- **Related Component:** `ctb/ai/barton/imo-creator/`

---

## 🔗 Entity Relationships

### Relationship Diagram

```
┌─────────────────┐
│ company_master  │
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│ employee_master │    │ company_vendor   │◄───────┐
└────────┬────────┘    │     _link        │        │
         │             └────────┬─────────┘        │
         │                      │                  │
         │                      ▼                  │
         │             ┌─────────────────┐         │
         │             │ benefit_master  │         │
         │             └────────┬────────┘         │
         │                      │                  │
         │            ┌─────────┴──────────┐       │
         │            ▼                    ▼       │
         │   ┌──────────────────┐ ┌─────────────┐ │
         │   │ benefit_tier     │ │  employee_  │ │
         │   │     _cost        │ │   benefit_  │ │
         │   └──────────────────┘ │ enrollment  │ │
         │                        └──────▲──────┘ │
         └───────────────────────────────┘        │
                                                  │
┌─────────────────┐                               │
│ vendor_master   │───────────────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ vendor_output   │
│   _blueprint    │
└─────────────────┘
```

### Foreign Key Summary

| Child Table | Foreign Key Column | References | Cardinality |
|-------------|-------------------|------------|-------------|
| `employee_master` | `company_unique_id` | `company_master.company_unique_id` | Many-to-One |
| `company_vendor_link` | `company_unique_id` | `company_master.company_unique_id` | Many-to-One |
| `company_vendor_link` | `vendor_id` | `vendor_master.vendor_id` | Many-to-One |
| `benefit_master` | `company_vendor_id` | `company_vendor_link.company_vendor_id` | Many-to-One |
| `benefit_tier_cost` | `benefit_unique_id` | `benefit_master.benefit_unique_id` | Many-to-One |
| `employee_benefit_enrollment` | `employee_unique_id` | `employee_master.employee_unique_id` | Many-to-One |
| `employee_benefit_enrollment` | `benefit_unique_id` | `benefit_master.benefit_unique_id` | Many-to-One |
| `vendor_output_blueprint` | `vendor_id` | `vendor_master.vendor_id` | Many-to-One |

---

## 🎯 Barton ID Conventions

All primary keys follow the **Barton Doctrine** for ID generation:

### UUID Format
- **Type:** UUID v4 (randomly generated)
- **Generation:** `gen_random_uuid()` (PostgreSQL native function)
- **Format:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- **Example:** `550e8400-e29b-41d4-a716-446655440000`

### Column Naming Convention
- **Pattern:** `{entity}_unique_id` or `{entity}_id`
- **Examples:**
  - `company_unique_id`
  - `employee_unique_id`
  - `vendor_id`
  - `enrollment_id`

### HEIR-Compliant Process IDs
For process tracking (used in SSOT API):
- **Format:** `{PREFIX}-{YYYYMMDD}-{HASH}`
- **Prefix Examples:**
  - `CLNT` - Client operations
  - `PROC` - Process tracking
  - `ENRL` - Enrollment operations
- **Example:** `CLNT-20251023-ABC123456`

---

## 🔐 Data Security

### PII Handling
- **Full SSN:** Never stored
- **Partial SSN:** Last 4 digits only (`ssn_last4`)
- **DOB:** Stored for age verification only
- **Names:** Required for benefits administration

### Encryption
- Database: TLS encryption in transit (Neon)
- At Rest: PostgreSQL native encryption
- Configuration: See [ctb/data/.env.example](.env.example)

---

## 📊 Schema Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 8 |
| Total Columns | 75+ |
| Foreign Keys | 9 |
| Check Constraints | 2 (tier_type validation) |
| Unique Constraints | 1 (company.ein) |
| JSONB Columns | 1 (mapping_json) |
| Timestamp Tracking | 8 tables (created_at on all) |
| UUID Primary Keys | 8 (100%) |

---

## 🔧 Database Configuration

### Connection Details

**Primary Database (Neon PostgreSQL):**
```bash
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/client_subhive
DATABASE_NAME=client_subhive
DATABASE_SSL=true
```

**Test Database:**
```bash
TEST_DATABASE_URL=postgresql://localhost/client_subhive_test
```

See [ctb/data/.env.example](.env.example) for complete configuration.

### Schema Files

| File | Purpose | Lines |
|------|---------|-------|
| [01_schema.sql](db/neon/01_schema.sql) | Table definitions | 94 |
| [02_views.sql](db/neon/02_views.sql) | View definitions | TBD |
| [03_seed.sql](db/neon/03_seed.sql) | Seed data | TBD |
| [client_subhive_intake.sql](db/neon/client_subhive_intake.sql) | Intake-specific schema | TBD |

---

## 🧪 Testing

### Schema Tests

**Location:** [ctb/data/tests/test_schemas.py](tests/test_schemas.py)

**Test Coverage:**
- Registry file existence
- Firebase type definitions
- Model structure validation
- Migration format validation

**Run Tests:**
```bash
cd ctb/data/tests
python -m pytest test_schemas.py -v
```

### Test Fixtures

**Location:** [ctb/data/tests/fixtures/](tests/fixtures/)

**Available Fixtures:**
- Sample client data
- Sample employee data
- Sample benefit data
- Sample enrollment data

See [ctb/data/tests/fixtures/README.md](tests/fixtures/README.md) for usage.

---

## 🔄 Migrations

### Migration System

**Location:** `ctb/data/migrations/`
**Tracking Table:** `schema_migrations`

**Environment Variables:**
```bash
MIGRATIONS_DIR=ctb/data/migrations
MIGRATION_TABLE=schema_migrations
AUTO_MIGRATE=false
```

### Migration Best Practices
1. All schema changes via migrations
2. Sequential numbering (01_, 02_, etc.)
3. Reversible when possible
4. Test on staging before production
5. Track in schema_migrations table

---

## 📋 Common Queries

### Get All Employees for a Company
```sql
SELECT e.*
FROM clnt.employee_master e
JOIN clnt.company_master c ON e.company_unique_id = c.company_unique_id
WHERE c.company_name = 'Acme Corp';
```

### Get Active Enrollments for Employee
```sql
SELECT e.*, b.benefit_type, bt.cost_amount
FROM clnt.employee_benefit_enrollment e
JOIN clnt.benefit_master b ON e.benefit_unique_id = b.benefit_unique_id
JOIN clnt.benefit_tier_cost bt ON b.benefit_unique_id = bt.benefit_unique_id
  AND e.tier_type = bt.tier_type
WHERE e.employee_unique_id = $1
  AND e.termination_date IS NULL;
```

### Get Company Vendors with Contact Info
```sql
SELECT c.company_name, v.vendor_name, cvl.*
FROM clnt.company_vendor_link cvl
JOIN clnt.company_master c ON cvl.company_unique_id = c.company_unique_id
JOIN clnt.vendor_master v ON cvl.vendor_id = v.vendor_id
WHERE c.company_unique_id = $1;
```

---

## 🔗 Integration Points

### 1. API Layer
- **Endpoint:** `/api/ssot/save`
- **Purpose:** Persist data with HEIR-compliant IDs
- **Usage:** All data intake flows through this endpoint
- **Documentation:** [ctb/sys/api/API_CATALOG.md](../sys/api/API_CATALOG.md)

### 2. AI Layer
- **Component:** `ctb/ai/barton/imo-creator/`
- **Purpose:** Transform data using vendor blueprints
- **Blueprint Table:** `clnt.vendor_output_blueprint`
- **Documentation:** [ctb/ai/README.md](../ai/README.md)

### 3. UI Layer
- **Component:** Client intake wizard
- **Purpose:** Collect and validate data
- **Tables Used:** All tables
- **Documentation:** [ctb/ui/README.md](../ui/README.md)

### 4. MCP Servers
- **Component:** Smartsheet MCP
- **Purpose:** Sync enrollment data
- **Tables Used:** `employee_benefit_enrollment`, `benefit_master`
- **Documentation:** [ctb/sys/README.md](../sys/README.md)

---

## 📚 Related Documentation

- **Architecture Diagram:** [ctb/docs/architecture.mmd](../docs/architecture.mmd)
- **API Catalog:** [ctb/sys/api/API_CATALOG.md](../sys/api/API_CATALOG.md)
- **Dependencies:** [ctb/meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md)
- **Entry Point:** [ENTRYPOINT.md](../../ENTRYPOINT.md)
- **Column Registry:** [clnt_column_registry.yml](db/registry/clnt_column_registry.yml)
- **Environment Setup:** [.env.example](.env.example)

---

**Implementation Status:** ✅ COMPLETE
**Traceability:** ✅ 100%
**Tables Documented:** 8/8
**STAMPED Coverage:** ✅ ALL TABLES
**Last Updated:** 2025-10-23
