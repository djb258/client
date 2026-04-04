# Client Schema Reference — `clnt` Schema

All tables live in the `clnt` Neon PostgreSQL schema. Every table carries `client_id` (UUID)
as the universal join key to the spine table `clnt.client`.

Source of truth: `src/data/db/registry/clnt_column_registry.yml`
Generated Zod schemas: `src/data/spokes/s{1-5}-*/schema.ts`

---

## S1: Hub (SPINE)

### `clnt.client` (CANONICAL)

The spine table. Every other table joins here via `client_id`.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK (auto-generated) |
| `legal_name` | TEXT | NO | Legal company name as registered |
| `fein` | TEXT | YES | Federal Employer Identification Number |
| `domicile_state` | TEXT | YES | Two-letter state code of legal domicile |
| `effective_date` | DATE | YES | Client effective date for coverage |
| `status` | TEXT | NO | Lifecycle: `active`, `terminated`, `suspended` |
| `source` | TEXT | YES | Origin system: `manual`, `api`, `migration` |
| `version` | INTEGER | NO | Optimistic concurrency counter |
| `domain` | TEXT | YES | Custom domain for client portal |
| `label_override` | TEXT | YES | Display name override for UI rendering |
| `logo_url` | TEXT | YES | Client logo URL for branding |
| `color_primary` | TEXT | YES | Primary brand color (hex) |
| `color_accent` | TEXT | YES | Accent brand color (hex) |
| `feature_flags` | JSONB | NO | Feature toggle config (default: `{}`) |
| `dashboard_blocks` | JSONB | NO | Dashboard block layout config (default: `[]`) |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.client_error` (ERROR)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `source_entity` | TEXT | NO | Table or process that produced the error |
| `source_id` | UUID | YES | Entity UUID that caused the error |
| `error_code` | TEXT | NO | Machine-readable error code |
| `error_message` | TEXT | NO | Human-readable description |
| `severity` | TEXT | NO | CHECK: `warning`, `error`, `critical` |
| `status` | TEXT | NO | CHECK: `open`, `resolved`, `dismissed` |
| `context` | JSONB | YES | Additional error metadata |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |

---

## S2: Plan

### `clnt.plan` (CANONICAL)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `benefit_type` | TEXT | NO | Category: `medical`, `dental`, `vision`, `life`, etc. |
| `carrier_id` | TEXT | YES | Carrier identifier |
| `effective_date` | DATE | YES | Coverage period effective date |
| `status` | TEXT | NO | Lifecycle: `active`, `terminated`, `pending` |
| `version` | INTEGER | NO | Optimistic concurrency counter |
| `rate_ee` | TEXT | YES | Employee-only rate |
| `rate_es` | TEXT | YES | Employee + Spouse rate |
| `rate_ec` | TEXT | YES | Employee + Children rate |
| `rate_fam` | TEXT | YES | Family rate |
| `employer_rate_ee` | TEXT | YES | Employer contribution: Employee tier |
| `employer_rate_es` | TEXT | YES | Employer contribution: Employee + Spouse |
| `employer_rate_ec` | TEXT | YES | Employer contribution: Employee + Children |
| `employer_rate_fam` | TEXT | YES | Employer contribution: Family |
| `source_quote_id` | UUID | YES | FK to `clnt.plan_quote` — promotion lineage |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.plan_error` (ERROR)

Same pattern as `clnt.client_error`. Columns: `id`, `client_id`, `source_entity`, `source_id`, `error_code`, `error_message`, `severity`, `status`, `context`, `created_at`.

### `clnt.plan_quote` (SUPPORT)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `benefit_type` | TEXT | NO | Benefit category this quote covers |
| `carrier_id` | TEXT | NO | Carrier submitting the quote |
| `effective_year` | INTEGER | NO | Plan year this quote applies to |
| `rate_ee` | TEXT | YES | Quoted Employee-only rate |
| `rate_es` | TEXT | YES | Quoted Employee + Spouse rate |
| `rate_ec` | TEXT | YES | Quoted Employee + Children rate |
| `rate_fam` | TEXT | YES | Quoted Family rate |
| `source` | TEXT | YES | Origin: `broker`, `carrier portal`, `RFP` |
| `received_date` | DATE | YES | Date the quote was received |
| `status` | TEXT | NO | Lifecycle: `received`, `presented`, `selected`, `rejected` |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

---

## S3: Employee

### `clnt.person` (CANONICAL)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `first_name` | TEXT | NO | First name |
| `last_name` | TEXT | NO | Last name |
| `ssn_hash` | TEXT | YES | Hashed SSN (never stores raw SSN) |
| `status` | TEXT | NO | Lifecycle: `active`, `terminated`, `on_leave` |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.employee_error` (ERROR)

Same error pattern. Columns: `id`, `client_id`, `source_entity`, `source_id`, `error_code`, `error_message`, `severity`, `status`, `context`, `created_at`.

### `clnt.election` (SUPPORT)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `person_id` | UUID | NO | FK to `clnt.person` |
| `plan_id` | UUID | NO | FK to `clnt.plan` |
| `coverage_tier` | TEXT | NO | CHECK: `EE`, `ES`, `EC`, `FAM` |
| `effective_date` | DATE | NO | Election effective date |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.enrollment_intake` (STAGING)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `status` | TEXT | NO | Batch status: `pending`, `processing`, `completed`, `failed` |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.intake_record` (STAGING)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `enrollment_intake_id` | UUID | NO | FK to `clnt.enrollment_intake` |
| `raw_payload` | JSONB | NO | Raw intake data payload |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |

---

## S4: Vendor

### `clnt.vendor` (CANONICAL)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `vendor_name` | TEXT | NO | Vendor display name |
| `vendor_type` | TEXT | YES | Classification: `carrier`, `tpa`, `broker`, etc. |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.vendor_error` (ERROR)

Same error pattern. Columns: `id`, `client_id`, `source_entity`, `source_id`, `error_code`, `error_message`, `severity`, `status`, `context`, `created_at`.

### `clnt.external_identity_map` (SUPPORT)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `entity_type` | TEXT | NO | CHECK: `person`, `plan` |
| `internal_id` | UUID | NO | Internal entity UUID being mapped |
| `vendor_id` | UUID | NO | FK to `clnt.vendor` |
| `external_id_value` | TEXT | NO | Vendor's external identifier value |
| `effective_date` | DATE | YES | Effective date of this mapping |
| `status` | TEXT | NO | Lifecycle: `active`, `inactive` |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.invoice` (SUPPORT)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `vendor_id` | UUID | NO | FK to `clnt.vendor` |
| `invoice_number` | TEXT | NO | Vendor's invoice reference number |
| `amount` | TEXT | NO | Invoice total amount |
| `invoice_date` | DATE | NO | Date on the invoice |
| `due_date` | DATE | YES | Payment due date |
| `status` | TEXT | NO | Lifecycle: `received`, `approved`, `paid`, `disputed` |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

---

## S5: Service

### `clnt.service_request` (CANONICAL)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | PK |
| `client_id` | UUID | NO | FK to `clnt.client` |
| `category` | TEXT | NO | Category: `enrollment`, `billing`, `general`, etc. |
| `status` | TEXT | NO | Lifecycle: `open`, `in_progress`, `resolved`, `closed` |
| `created_at` | TIMESTAMPTZ | NO | Auto-set |
| `updated_at` | TIMESTAMPTZ | NO | Auto-set |

### `clnt.service_error` (ERROR)

Same error pattern. Columns: `id`, `client_id`, `source_entity`, `source_id`, `error_code`, `error_message`, `severity`, `status`, `context`, `created_at`.

---

## View

### `v_client_dashboard` (READ-ONLY)

Joins `clnt.client` projection data into a single surface for UI rendering.

| Column | Source | Description |
|--------|--------|-------------|
| `client_id` | `clnt.client.id` | PK |
| `legal_name` | `clnt.client.legal_name` | Display name |
| `status` | `clnt.client.status` | Lifecycle state |
| `effective_date` | `clnt.client.effective_date` | Coverage effective date |
| `domain` | `clnt.client.domain` | Custom portal domain |
| `label_override` | `clnt.client.label_override` | UI display name override |
| `logo_url` | `clnt.client.logo_url` | Client logo |
| `color_primary` | `clnt.client.color_primary` | Primary brand color |
| `color_accent` | `clnt.client.color_accent` | Accent brand color |
| `feature_flags` | `clnt.client.feature_flags` | Feature toggles |
| `dashboard_blocks` | `clnt.client.dashboard_blocks` | Dashboard layout |

**The UI queries this view, not the individual tables.**

---

## Key Relationships

```
clnt.client (SPINE)
  |-- clnt.client_error
  |-- clnt.plan
  |     |-- clnt.plan_error
  |     |-- clnt.plan_quote (source_quote_id → plan_quote.id)
  |-- clnt.person
  |     |-- clnt.employee_error
  |     |-- clnt.election (person_id → person.id, plan_id → plan.id)
  |     |-- clnt.enrollment_intake
  |           |-- clnt.intake_record (enrollment_intake_id → enrollment_intake.id)
  |-- clnt.vendor
  |     |-- clnt.vendor_error
  |     |-- clnt.external_identity_map (vendor_id → vendor.id, internal_id → person/plan.id)
  |     |-- clnt.invoice (vendor_id → vendor.id)
  |-- clnt.service_request
  |     |-- clnt.service_error
  |-- v_client_dashboard (view)
```
