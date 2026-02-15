# Database Schema Reference

**Schema**: `clnt`
**Database**: Neon PostgreSQL
**Version**: 2.2.0
**Status**: ACTIVE
**ADR**: ADR-002-ctb-consolidated-backbone, ADR-004-renewal-downgraded-to-plan-support

---

## Overview

| Metric | Value |
|--------|-------|
| Schema | `clnt` |
| Total Tables | 14 |
| Total Views | 1 |
| Universal Join Key | `client_id` (UUID) |
| Spine Table | `clnt.client_hub` |
| Spokes | S1-S8 |
| PK Type | UUID via `gen_random_uuid()` (all tables) |

---

## Table Catalog

### S1: Hub — Root Identity

#### `clnt.client_hub` (FROZEN)

Spine table. Read-only after creation. Mints `client_id`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `client_id` | UUID | NOT NULL | `gen_random_uuid()` | PK, universal join key |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `status` | TEXT | NOT NULL | `'active'` | Lifecycle state |
| `source` | TEXT | NULL | | Origin system |
| `version` | INT | NOT NULL | `1` | Record version |

#### `clnt.client_master` (CANONICAL)

Client legal and business details. 1:1 with `client_hub`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `client_id` | UUID | NOT NULL | | PK + FK to `client_hub` |
| `legal_name` | TEXT | NOT NULL | | Legal company name |
| `fein` | TEXT | NULL | | Federal EIN |
| `domicile_state` | TEXT | NULL | | State of domicile |
| `effective_date` | DATE | NULL | | Client effective date |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_client_master_fein`, `idx_client_master_state`

#### `clnt.client_projection` (SUPPORT)

Per-client UI projection configuration. 1:1 with `client_hub`. ADR-005.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `client_id` | UUID | NOT NULL | | PK + FK to `client_hub` |
| `domain` | TEXT | NULL | | Custom domain |
| `label_override` | TEXT | NULL | | Display name override |
| `logo_url` | TEXT | NULL | | Client logo URL |
| `color_primary` | TEXT | NULL | | Primary brand color |
| `color_accent` | TEXT | NULL | | Accent brand color |
| `feature_flags` | JSONB | NOT NULL | `'{}'` | Feature toggles |
| `dashboard_blocks` | JSONB | NOT NULL | `'[]'` | Dashboard block configuration |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_client_projection_domain`

---

### S2: Plan — Benefits & Quote Intake

#### `clnt.plan` (CANONICAL)

Canonical benefit plans with embedded fixed cost tiers.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `plan_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `benefit_type` | TEXT | NOT NULL | | medical, dental, vision, life, etc. |
| `carrier_id` | TEXT | NULL | | Carrier identifier |
| `effective_date` | DATE | NULL | | |
| `status` | TEXT | NOT NULL | `'active'` | |
| `version` | INT | NOT NULL | `1` | |
| `rate_ee` | NUMERIC(10,2) | NULL | | Employee rate |
| `rate_es` | NUMERIC(10,2) | NULL | | Employee + Spouse rate |
| `rate_ec` | NUMERIC(10,2) | NULL | | Employee + Children rate |
| `rate_fam` | NUMERIC(10,2) | NULL | | Family rate |
| `employer_rate_ee` | NUMERIC(10,2) | NULL | | Employer contribution (EE) |
| `employer_rate_es` | NUMERIC(10,2) | NULL | | Employer contribution (ES) |
| `employer_rate_ec` | NUMERIC(10,2) | NULL | | Employer contribution (EC) |
| `employer_rate_fam` | NUMERIC(10,2) | NULL | | Employer contribution (FAM) |
| `source_quote_id` | UUID | NULL | | FK to `plan_quote` (promotion lineage) |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_plan_client`, `idx_plan_benefit_type`, `idx_plan_status`

#### `clnt.plan_quote` (SUPPORT)

Received carrier quotes. Multiple per benefit/year allowed. Promotion copies rates into `plan`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `plan_quote_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `benefit_type` | TEXT | NOT NULL | | |
| `carrier_id` | TEXT | NOT NULL | | |
| `effective_year` | INT | NOT NULL | | |
| `rate_ee` | NUMERIC(10,2) | NULL | | |
| `rate_es` | NUMERIC(10,2) | NULL | | |
| `rate_ec` | NUMERIC(10,2) | NULL | | |
| `rate_fam` | NUMERIC(10,2) | NULL | | |
| `source` | TEXT | NULL | | Origin of quote |
| `received_date` | DATE | NULL | | |
| `status` | TEXT | NOT NULL | `'received'` | CHECK: received, presented, selected, rejected |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |

**Indexes**: `idx_plan_quote_client_benefit_year`, `idx_plan_quote_status`

---

### S3: Intake — Enrollment Staging

#### `clnt.intake_batch` (STAGING)

Batch upload header. Staging only.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `intake_batch_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `upload_date` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `status` | TEXT | NOT NULL | `'pending'` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_intake_batch_client`, `idx_intake_batch_status`

#### `clnt.intake_record` (STAGING)

Individual raw records within a batch. Immutable after insert.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `intake_record_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `intake_batch_id` | UUID | NOT NULL | | FK to `intake_batch` |
| `raw_payload` | JSONB | NOT NULL | | Raw intake data |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |

**Indexes**: `idx_intake_record_client`, `idx_intake_record_batch`

---

### S4: Vault — Employee Identity & Elections

#### `clnt.person` (CANONICAL)

Employee/dependent identity. Never stores raw SSN.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `person_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `first_name` | TEXT | NOT NULL | | |
| `last_name` | TEXT | NOT NULL | | |
| `ssn_hash` | TEXT | NULL | | Hashed SSN (never raw) |
| `status` | TEXT | NOT NULL | `'active'` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_person_client`, `idx_person_status`, `idx_person_ssn_hash`

#### `clnt.election` (CANONICAL)

Benefit election bridge. Links person to plan with coverage tier.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `election_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `person_id` | UUID | NOT NULL | | FK to `person` |
| `plan_id` | UUID | NOT NULL | | FK to `plan` |
| `coverage_tier` | TEXT | NOT NULL | | CHECK: EE, ES, EC, FAM |
| `effective_date` | DATE | NOT NULL | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_election_client`, `idx_election_person`, `idx_election_plan`

---

### S5: Vendor — Identity & ID Translation

#### `clnt.vendor` (CANONICAL)

Vendor identity per client.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `vendor_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `vendor_name` | TEXT | NOT NULL | | |
| `vendor_type` | TEXT | NULL | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_vendor_client`

#### `clnt.external_identity_map` (CANONICAL)

Internal-to-external ID translation. External IDs never replace internal UUIDs.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `external_identity_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `entity_type` | TEXT | NOT NULL | | CHECK: person, plan |
| `internal_id` | UUID | NOT NULL | | Internal entity UUID |
| `vendor_id` | UUID | NOT NULL | | FK to `vendor` |
| `external_id_value` | TEXT | NOT NULL | | Vendor's external ID |
| `effective_date` | DATE | NULL | | |
| `status` | TEXT | NOT NULL | `'active'` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_ext_id_client`, `idx_ext_id_vendor`, `idx_ext_id_internal`, `idx_ext_id_entity_type`

---

### S6: Service — Ticket Tracking

#### `clnt.service_request` (CANONICAL)

Service ticket tracking.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `service_request_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `category` | TEXT | NOT NULL | | |
| `status` | TEXT | NOT NULL | `'open'` | |
| `opened_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_service_request_client`, `idx_service_request_status`

---

### S7: Compliance — Flag Tracking

#### `clnt.compliance_flag` (CANONICAL)

Compliance flag tracking per client.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `compliance_flag_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `flag_type` | TEXT | NOT NULL | | |
| `status` | TEXT | NOT NULL | `'open'` | |
| `effective_date` | DATE | NULL | | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes**: `idx_compliance_flag_client`, `idx_compliance_flag_status`

---

### S8: Audit — System Trail

#### `clnt.audit_event` (AUDIT)

Append-only system audit trail. No updates, no deletes.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `audit_event_id` | UUID | NOT NULL | `gen_random_uuid()` | PK |
| `client_id` | UUID | NOT NULL | | FK to `client_hub` |
| `entity_type` | TEXT | NOT NULL | | What was acted on |
| `entity_id` | UUID | NOT NULL | | ID of the entity |
| `action` | TEXT | NOT NULL | | What happened |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |

**Indexes**: `idx_audit_event_client`, `idx_audit_event_entity`, `idx_audit_event_action`, `idx_audit_event_created`

---

## Views

### `clnt.v_client_dashboard`

Read-only dashboard surface for lovable.dev. Joins hub + master + projection. ADR-005.

| Column | Source | Notes |
|--------|--------|-------|
| `client_id` | `client_hub.client_id` | |
| `status` | `client_hub.status` | |
| `hub_created_at` | `client_hub.created_at` | |
| `legal_name` | `client_master.legal_name` | |
| `domicile_state` | `client_master.domicile_state` | |
| `effective_date` | `client_master.effective_date` | |
| `display_name` | `COALESCE(client_projection.label_override, client_master.legal_name)` | |
| `domain` | `client_projection.domain` | |
| `logo_url` | `client_projection.logo_url` | |
| `color_primary` | `client_projection.color_primary` | |
| `color_accent` | `client_projection.color_accent` | |
| `feature_flags` | `client_projection.feature_flags` | |
| `dashboard_blocks` | `client_projection.dashboard_blocks` | |

**Joins**: `client_hub` JOIN `client_master` USING (`client_id`) LEFT JOIN `client_projection` USING (`client_id`)

---

## Foreign Key Summary

| Child Table | FK Column | References | Cardinality |
|-------------|-----------|------------|-------------|
| `client_master` | `client_id` | `client_hub.client_id` | 1:1 |
| `client_projection` | `client_id` | `client_hub.client_id` | 1:1 |
| `plan` | `client_id` | `client_hub.client_id` | N:1 |
| `plan` | `source_quote_id` | `plan_quote.plan_quote_id` | N:1 (nullable) |
| `plan_quote` | `client_id` | `client_hub.client_id` | N:1 |
| `intake_batch` | `client_id` | `client_hub.client_id` | N:1 |
| `intake_record` | `client_id` | `client_hub.client_id` | N:1 |
| `intake_record` | `intake_batch_id` | `intake_batch.intake_batch_id` | N:1 |
| `person` | `client_id` | `client_hub.client_id` | N:1 |
| `election` | `client_id` | `client_hub.client_id` | N:1 |
| `election` | `person_id` | `person.person_id` | N:1 |
| `election` | `plan_id` | `plan.plan_id` | N:1 |
| `vendor` | `client_id` | `client_hub.client_id` | N:1 |
| `external_identity_map` | `client_id` | `client_hub.client_id` | N:1 |
| `external_identity_map` | `vendor_id` | `vendor.vendor_id` | N:1 |
| `service_request` | `client_id` | `client_hub.client_id` | N:1 |
| `compliance_flag` | `client_id` | `client_hub.client_id` | N:1 |
| `audit_event` | `client_id` | `client_hub.client_id` | N:1 |

---

## CHECK Constraints

| Table | Column | Allowed Values |
|-------|--------|----------------|
| `election` | `coverage_tier` | `EE`, `ES`, `EC`, `FAM` |
| `external_identity_map` | `entity_type` | `person`, `plan` |
| `plan_quote` | `status` | `received`, `presented`, `selected`, `rejected` |

---

## Shared Infrastructure

- **Trigger function**: `clnt.set_updated_at()` — auto-stamps `updated_at` on UPDATE
- **Extension**: `pgcrypto` — provides `gen_random_uuid()`
- **All PKs**: UUID via `gen_random_uuid()` (no SERIAL, no TEXT, no composite)
- **All tables**: `client_id` FK to `client_hub` (universal join key)

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.3.0 |
| Created | 2025-10-23 |
| Last Modified | 2026-02-15 |
| Source of Truth | `db/neon/migrations/20_ctb_consolidated_backbone.sql`, `30_remove_renewal_add_plan_quote.sql`, `35_client_projection.sql` |
| ADR | ADR-002-ctb-consolidated-backbone, ADR-004-renewal-downgraded-to-plan-support, ADR-005-client-projection-support |
| Status | ACTIVE |
