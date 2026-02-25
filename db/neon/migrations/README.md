# Client-Subhive Database Migrations

**Hub**: client-subhive
**Schema**: `clnt` (canonical), `ctb` (governance)
**Version**: 3.4.0

---

## Migration Chain

| Migration | Schema | Purpose | Status |
|-----------|--------|---------|--------|
| `10_clnt_core_schema.sql` | core | Gen 1 legacy identity | DEPRECATED |
| `11_clnt_benefits_schema.sql` | benefits | Gen 1 legacy benefits | DEPRECATED |
| `12_clnt_compliance_schema.sql` | compliance | Gen 1 legacy compliance | DEPRECATED |
| `13_clnt_operations_schema.sql` | operations | Gen 1 legacy operations | DEPRECATED |
| `14_clnt_staging_schema.sql` | staging | Gen 1 legacy staging | DEPRECATED |
| `15_clnt_seed_data.sql` | all | Gen 1 seed data | DEPRECATED |
| `20_ctb_consolidated_backbone.sql` | clnt | CTB backbone: 12 tables (S1-S8) | ACTIVE |
| `25_add_renewal_subhub.sql` | clnt | ADR-003 renewal tables | WITHDRAWN |
| `30_remove_renewal_add_plan_quote.sql` | clnt | ADR-004: remove renewal, add plan_quote | ACTIVE |
| `35_client_projection.sql` | clnt | ADR-005: client_projection table | ACTIVE |
| `40_ctb_registry_infrastructure.sql` | ctb | Registry-first enforcement stack | ACTIVE |

### Gen 1 (10-15) — DEPRECATED

Legacy 5-schema architecture (core, benefits, compliance, operations, staging). Superseded by migration 20. These schemas still exist in the database but are not used by current application code.

### CTB Backbone (20-35) — ACTIVE

Canonical `clnt` schema with 14 tables across 5 spokes. All tables use UUID PKs, FK to `client_hub.client_id`.

### CTB Enforcement (40) — ACTIVE

Deploys the full registry-first enforcement infrastructure:

| Component | Source Template | Purpose |
|-----------|----------------|---------|
| `ctb.table_registry` | 001 | Runtime mirror of column_registry.yml |
| `ctb.registry_audit_log` | 001 | Audit trail for registry changes |
| DDL event triggers | 002 | Block CREATE/ALTER/DROP on unregistered tables |
| Write guards | 003 | Block DML on unregistered/frozen tables |
| `ctb.promotion_paths` | 004 | Declared STAGING/SUPPORT → CANONICAL flow paths |
| Promotion enforcement | 004 | Block direct writes to CANONICAL without declared source |
| `ctb.vendor_bridges` | 005 | Registered vendor integration points |
| Immutability guards | 005 | INSERT-only on STAGING; no DELETE on CANONICAL/SUPPORT/ERROR |
| `ctb_app_role` | 011 | Non-superuser application role |

---

## Current Table Inventory (14 tables in `clnt`)

| Spoke | Table | Leaf Type | Migration |
|-------|-------|-----------|-----------|
| S1-hub | `client_hub` | CANONICAL | 20 |
| S1-hub | `client_master` | CANONICAL | 20 |
| S1-hub | `client_projection` | SUPPORT | 35 |
| S2-plan | `plan` | CANONICAL | 20 |
| S2-plan | `plan_quote` | SUPPORT | 30 |
| S3-employee | `person` | CANONICAL | 20 |
| S3-employee | `election` | SUPPORT | 20 |
| S3-employee | `intake_batch` | STAGING | 20 |
| S3-employee | `intake_record` | STAGING | 20 |
| S4-vendor | `vendor` | CANONICAL | 20 |
| S4-vendor | `external_identity_map` | SUPPORT | 20 |
| S5-service | `service_request` | CANONICAL | 20 |
| S5-service | `compliance_flag` | CANONICAL | 20 |
| S1-hub | `audit_event` | STAGING | 20 |

---

## Governance Infrastructure (`ctb` schema)

| Table | Purpose |
|-------|---------|
| `ctb.table_registry` | Runtime registry of all allowed tables |
| `ctb.registry_audit_log` | Audit trail for registry changes |
| `ctb.promotion_paths` | Declared data flow paths |
| `ctb.vendor_bridges` | Registered vendor integration points |

---

## Registry-First Rule

> Register the table in `ctb.table_registry` BEFORE creating it.

All DDL and DML is gated by the enforcement stack deployed in migration 40. New tables must be:

1. Declared in `src/data/db/registry/clnt_column_registry.yml`
2. Registered in `ctb.table_registry` (via migration)
3. Created via DDL (migration will fail if not registered)
4. Guarded via `ctb.create_write_guard()` and `ctb.create_immutability_guard()`

Doctrine: `CTB_REGISTRY_ENFORCEMENT.md`

---

## Running Migrations

```bash
# Via Doppler (required — no .env files)
doppler run -- psql $NEON_DATABASE_URL -f db/neon/migrations/40_ctb_registry_infrastructure.sql
```

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 3.4.0 |
| Last Updated | 2026-02-25 |
| Authority | client-subhive (CC-02) |
| Doctrine | CTB_REGISTRY_ENFORCEMENT.md |
