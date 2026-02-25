# CTB Governance Document

**Version**: 3.4.1
**Status**: ACTIVE
**Authority**: Derived from `doctrine/ARCHITECTURE.md`, `templates/doctrine/CTB_REGISTRY_ENFORCEMENT.md`
**Change Protocol**: ADR + HUMAN APPROVAL REQUIRED

---

## Purpose

This document defines the CTB (Christmas Tree Backbone) governance structure for the client-subhive repository. It tracks:

- **Table Classification**: Every table has a designated leaf type per OWN-10a/10b/10c
- **Registry-First Enforcement**: All tables registered in `clnt_column_registry.yml` before creation
- **Governance Enforcement**: Frozen tables cannot be modified without formal change request
- **Drift Detection**: Automated via `ctb-drift-audit.sh` and `ctb-registry-gate.sh`
- **Audit Trail**: Complete history of table modifications and violations

---

## 1. Overview

### 1.1 CTB Registry Location

```
Schema: clnt
Tables: 16
Views: 0
Spokes: S1-S5 (v3.4.1 consolidation)
Column Registry: src/data/db/registry/clnt_column_registry.yml
Codegen: scripts/codegen-schema.ts
ADRs: ADR-002, ADR-004, ADR-005 (ADR-006 pending)
```

### 1.2 Quick Reference

| Metric | Value |
|--------|-------|
| Total Tables Registered | 16 |
| Views | 0 |
| Spokes | 5 (S1-S5) |
| Canonical Tables | 5 (client, plan, person, vendor, service_request) |
| Error Tables | 5 (client_error, plan_error, employee_error, vendor_error, service_error) |
| Support Tables | 4 (plan_quote, election, external_identity_map, invoice) |
| Staging Tables | 2 (enrollment_intake, intake_record) |
| Current Violations | 0 |
| Spine Table | clnt.client |
| Join Key Integrity | ALIGNED (client_id on all tables) |

---

## 2. Leaf Type Classification (OWN-10 Cardinality)

| Leaf Type | Count | Description | Modification Rules |
|-----------|-------|-------------|-------------------|
| **CANONICAL** | 5 | Core data tables (1 per spoke — OWN-10a) | Insert + full update |
| **ERROR** | 5 | Error tracking (1 per spoke — OWN-10b) | Insert-only (append) |
| **SUPPORT** | 4 | Additional tables (ADR-justified — OWN-10c) | Insert + limited update |
| **STAGING** | 2 | Intake/staging tables | Insert-only or insert + status update |

### 2.1 Full Table Registry

| Schema | Table | Spoke | Leaf Type | Write Rule |
|--------|-------|-------|-----------|------------|
| clnt | **client** | S1 | CANONICAL | Insert + full update (SPINE) |
| clnt | client_error | S1 | ERROR | Append-only |
| clnt | **plan** | S2 | CANONICAL | Insert + full update |
| clnt | plan_error | S2 | ERROR | Append-only |
| clnt | plan_quote | S2 | SUPPORT | Insert + status update only |
| clnt | **person** | S3 | CANONICAL | Insert + full update |
| clnt | employee_error | S3 | ERROR | Append-only |
| clnt | election | S3 | SUPPORT | Insert + coverage_tier, effective_date update |
| clnt | enrollment_intake | S3 | STAGING | Insert + status update |
| clnt | intake_record | S3 | STAGING | Immutable after insert |
| clnt | **vendor** | S4 | CANONICAL | Insert + full update |
| clnt | vendor_error | S4 | ERROR | Append-only |
| clnt | external_identity_map | S4 | SUPPORT | Insert + status, effective_date update |
| clnt | invoice | S4 | SUPPORT | Insert + status, due_date update |
| clnt | **service_request** | S5 | CANONICAL | Insert + full update |
| clnt | service_error | S5 | ERROR | Append-only |

---

## 3. Spine Table

| Schema | Table | Purpose |
|--------|-------|---------|
| clnt | client | Sovereign identity — `client_id` (UUID, immutable) |

The `client` table is the SPINE. All other tables FK to `client.client_id`. This table was created by merging the former `client_hub`, `client_master`, and `client_projection` tables (v3.4.1).

---

## 4. Column Contracts

### 4.1 Universal FK Contract

Every table (except `client`) has:

| Column | Constraint |
|--------|------------|
| `client_id` | NOT NULL, FK to `clnt.client(client_id)` |

### 4.2 PK Contract

All primary keys are UUID via `gen_random_uuid()`. No SERIAL, no TEXT, no composite PKs.

### 4.3 CHECK Constraints

| Table | Column | Allowed Values |
|-------|--------|----------------|
| election | coverage_tier | `EE`, `ES`, `EC`, `FAM` |
| external_identity_map | entity_type | `person`, `plan` |
| plan_quote | status | `received`, `presented`, `selected`, `rejected` |
| invoice | status | `draft`, `sent`, `paid`, `overdue`, `cancelled` |
| *_error | severity | `low`, `medium`, `high`, `critical` |
| *_error | status | `open`, `acknowledged`, `resolved`, `dismissed` |

---

## 5. Drift Detection

### 5.1 Enforcement Scripts (v3.4.1)

| Script | Purpose | Run When |
|--------|---------|----------|
| `scripts/ctb-registry-gate.sh` | Registry vs migrations validation + cardinality | Pre-commit, CI |
| `scripts/ctb-drift-audit.sh` | Live DB vs registry vs YAML (3-surface) | CI, on-demand |
| `scripts/detect-banned-db-clients.sh` | Banned DB client imports in src/ | Pre-commit, CI |
| `scripts/verify-governance-ci.sh` | CI governance wiring validation | Bootstrap, CI |
| `scripts/bootstrap-audit.sh` | Day 0 structural validation | Initial setup |

### 5.2 Drift Types

| Type | Description | Severity | Action |
|------|-------------|----------|--------|
| `ROGUE_TABLE` | Exists in DB, not in registry | VIOLATION | Register or drop |
| `PHANTOM_TABLE` | In registry, not in DB | WARNING | Run migration |
| `ORPHAN_TABLE` | In DB, not in column_registry.yml | WARNING | Register in YAML |
| `GHOST_TABLE` | In YAML, not in DB | WARNING | Verify migration |
| `COLUMN_DRIFT` | Column mismatch between surfaces | WARNING | Reconcile |
| `MISSING_CLIENT_ID` | Table without client_id FK | VIOLATION | Add FK or drop table |
| `WRONG_PK_TYPE` | PK is not UUID | VIOLATION | Migrate to UUID |
| `LATERAL_JOIN` | Join without client_id | VIOLATION | Fix query |
| `UNREGISTERED_TABLE` | Table not in CTB registry | VIOLATION | Register or drop |

### 5.3 Current Drift Status

| Type | Count | Notes |
|------|-------|-------|
| ROGUE_TABLE | 0 | All tables registered |
| COLUMN_DRIFT | 0 | Registry in sync |
| MISSING_CLIENT_ID | 0 | All tables compliant |
| WRONG_PK_TYPE | 0 | All UUIDs |
| UNREGISTERED_TABLE | 0 | All 16 registered |

---

## 6. CTB Phase History

| Phase | Tag | Date | Scope |
|-------|-----|------|-------|
| Constitutional Admission | v0.1.0 | 2026-01-30 | Initial governance files |
| Structural Instantiation | v1.0.0 | 2026-02-05 | Old multi-schema structure |
| Template Sync | v1.1.0 | 2026-02-09 | ARCHITECTURE.md v2.0.0 alignment |
| CTB Consolidation | v2.0.0 | 2026-02-11 | Single `clnt` schema, 12 tables, S1-S8 spokes |
| Renewal Sub-Hub | v2.1.0 | 2026-02-11 | +2 tables (S9), +3 views — SUPERSEDED by v2.2.0 |
| Plan Quote Support | v2.2.0 | 2026-02-11 | Renewal removed (ADR-004). +plan_quote under S2. 13 tables |
| Client Projection | v2.3.0 | 2026-02-15 | +client_projection (S1 SUPPORT), +v_client_dashboard. ADR-005. 14 tables |
| **v3.4.1 Consolidation** | v3.4.1 | 2026-02-25 | Merge client tables → single SPINE. 8→5 spokes. +error tables. +invoice. 16 tables. Registry-first enforcement. New enforcement scripts. Template sync to imo-creator@08b734d |

---

## 7. Governance Rules

### 7.1 Table Creation (Registry-First)

New tables must:
1. Be registered in `src/data/db/registry/clnt_column_registry.yml` FIRST
2. Exist in `clnt` schema
3. Include `client_id UUID NOT NULL REFERENCES clnt.client(client_id)`
4. Use UUID PK via `gen_random_uuid()`
5. Be registered in this document
6. Have an ADR
7. Pass `ctb-registry-gate.sh` cardinality check (OWN-10a/10b/10c)
8. Run `codegen-schema.ts` to regenerate types/schemas

### 7.2 Table Modification

- **CANONICAL**: Normal DDL allowed (insert + full update)
- **ERROR**: Append-only, no updates or deletes, no structural changes without ADR
- **SUPPORT**: Limited updates (declared columns only), no structural changes without ADR
- **STAGING**: Insert-only or insert + status update, flexible modification

### 7.3 Table Deletion

Tables should be deprecated before deletion:
1. Mark as DEPRECATED in registry
2. Schedule removal date (min 1 release cycle grace period)
3. Migrate dependent queries
4. Create rollback migration
5. Drop after verification + human sign-off

---

## 8. Enforcement Rules

1. All writes occur at leaf tables only
2. Hub exposes read-only views via accessor (`src/data/hub/accessor.ts`)
3. No lateral spoke joins without `client_id`
4. Intake → Employee is one-way (staging to canonical)
5. External identity mapping must never replace internal IDs
6. All error tables are append-only
7. Quote promotion copies rates into `plan` — plan is always self-contained
8. **Registry-first**: Register → Create → Write (never the reverse)
9. **Fail-closed CI**: No `continue-on-error: true` on enforcement jobs
10. **Execution surface**: Executable code only in CTB branches (src/sys, src/data, src/app, src/ai, src/ui)
11. **Gatekeeper**: All DB access through `src/sys/modules/gatekeeper/` — no banned direct clients

---

## 9. Binding Doctrine (v3.4.1)

| Document | Location | Purpose |
|----------|----------|---------|
| CTB_REGISTRY_ENFORCEMENT.md | templates/doctrine/ | Registry-first rules, cardinality, drift audit |
| EXECUTION_SURFACE_LAW.md | templates/doctrine/ | Code placement whitelist |
| FAIL_CLOSED_CI_CONTRACT.md | templates/doctrine/ | CI gate contract (Gates A-E) |
| LEGACY_COLLAPSE_PLAYBOOK.md | templates/doctrine/ | 5-phase legacy migration |
| REPO_HOUSEKEEPING.md | templates/checklists/ | Quarterly structural audit |

---

## 10. Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| ADR-002 | `docs/adr/ADR-002-ctb-consolidated-backbone.md` | Consolidation decision |
| ADR-003 | `docs/adr/ADR-003-renewal-subhub.md` | Renewal sub-hub (WITHDRAWN) |
| ADR-004 | `docs/adr/ADR-004-renewal-downgraded-to-plan-support.md` | Renewal downgraded to plan support |
| ADR-005 | `docs/adr/ADR-005-client-projection-support.md` | Client projection support |
| ADR-006 | `docs/adr/ADR-006-v3-consolidation.md` | v3.4.1 restructure (PENDING) |
| Column Registry | `src/data/db/registry/clnt_column_registry.yml` | Single source of truth (v3.4.1) |
| Codegen | `scripts/codegen-schema.ts` | Registry → TypeScript generator |
| Gatekeeper | `src/sys/modules/gatekeeper/` | Audit logger module |
| CTB Map | `docs/CTB_MAP.md` | Spoke structure and join contracts |
| ERD | `src/data/ERD.md` | Generated entity-relationship diagram |
| ERD Metrics | `erd/ERD_METRICS.yaml` | Runtime table metrics |
| Migration (backbone) | `db/neon/migrations/20_ctb_consolidated_backbone.sql` | Schema DDL |
| Migration (plan quote) | `db/neon/migrations/30_remove_renewal_add_plan_quote.sql` | Remove renewal, add plan_quote |
| Migration (projection) | `db/neon/migrations/35_client_projection.sql` | client_projection + v_client_dashboard |
| Migration 40 | `db/neon/migrations/40_v3_consolidation.sql` | v3.4.1 DDL (PENDING) |
| Architecture Doctrine | `templates/doctrine/ARCHITECTURE.md` | CTB constitutional law |

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 3.4.1 |
| Created | 2026-02-09 |
| Last Modified | 2026-02-25 |
| Author | Claude Code |
| Status | ACTIVE |
| Review Cycle | Quarterly |
| Change Protocol | ADR REQUIRED |
