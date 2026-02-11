# CTB Governance Document

**Version**: 2.2.0
**Status**: ACTIVE
**Authority**: Derived from `doctrine/ARCHITECTURE.md`
**Change Protocol**: ADR + HUMAN APPROVAL REQUIRED

---

## Purpose

This document defines the CTB (Christmas Tree Backbone) governance structure for the client-subhive repository. It tracks:

- **Table Classification**: Every table has a designated leaf type
- **Governance Enforcement**: Frozen tables cannot be modified without formal change request
- **Drift Detection**: Automated identification of schema inconsistencies
- **Audit Trail**: Complete history of table modifications and violations

---

## 1. Overview

### 1.1 CTB Registry Location

```
Schema: clnt
Tables: 13
Spokes: S1-S8
ADR: ADR-002-ctb-consolidated-backbone, ADR-004-renewal-downgraded-to-plan-support
```

### 1.2 Quick Reference

| Metric | Value |
|--------|-------|
| Total Tables Registered | 13 |
| Views | 0 |
| Frozen Tables | 1 (client_hub) |
| Canonical Tables | 9 |
| Support Tables | 1 (plan_quote) |
| Staging Tables | 2 |
| Audit Tables | 1 |
| Current Violations | 0 |
| Join Key Integrity | ALIGNED (client_id on all tables) |

---

## 2. Leaf Type Classification

| Leaf Type | Count | Description | Modification Rules |
|-----------|-------|-------------|-------------------|
| **FROZEN** | 1 | Hub identity (read-only after creation) | Insert once, no updates |
| **CANONICAL** | 9 | Core data tables | Normal write access |
| **SUPPORT** | 1 | Support data (plan_quote) | Append-mostly, status updates only |
| **STAGING** | 2 | Intake/staging tables | Temporary, batch-scoped |
| **AUDIT** | 1 | System audit trail | Append-only, no updates or deletes |

### 2.1 Full Table Registry

| Schema | Table | Spoke | Leaf Type | Write Rule |
|--------|-------|-------|-----------|------------|
| clnt | client_hub | S1 | FROZEN | Insert once |
| clnt | client_master | S1 | CANONICAL | Normal |
| clnt | plan | S2 | CANONICAL | Normal |
| clnt | plan_quote | S2 | SUPPORT | Append-mostly, status updates only |
| clnt | intake_batch | S3 | STAGING | Batch-scoped |
| clnt | intake_record | S3 | STAGING | Immutable after insert |
| clnt | person | S4 | CANONICAL | Normal |
| clnt | election | S4 | CANONICAL | Normal |
| clnt | vendor | S5 | CANONICAL | Normal |
| clnt | external_identity_map | S5 | CANONICAL | Normal |
| clnt | service_request | S6 | CANONICAL | Normal |
| clnt | compliance_flag | S7 | CANONICAL | Normal |
| clnt | audit_event | S8 | AUDIT | Append-only |

---

## 3. Frozen Tables

| Schema | Table | Purpose |
|--------|-------|---------|
| clnt | client_hub | Root identity — sovereign `client_id` |

### 3.1 Change Request Process

To modify a frozen table:

1. Create ADR documenting the change rationale
2. Get approval from system owner (CC-02)
3. Execute change with audit trail
4. Update CTB registry

---

## 4. Column Contracts

### 4.1 Universal FK Contract

Every table (except `client_hub`) has:

| Column | Constraint |
|--------|------------|
| `client_id` | NOT NULL, FK to `clnt.client_hub(client_id)` |

### 4.2 PK Contract

All primary keys are UUID via `gen_random_uuid()`. No SERIAL, no TEXT, no composite PKs.

### 4.3 CHECK Constraints

| Table | Column | Allowed Values |
|-------|--------|----------------|
| election | coverage_tier | `EE`, `ES`, `EC`, `FAM` |
| external_identity_map | entity_type | `person`, `plan` |
| plan_quote | status | `received`, `presented`, `selected`, `rejected` |

---

## 5. Drift Detection

### 5.1 Drift Types

| Type | Description | Action |
|------|-------------|--------|
| `MISSING_CLIENT_ID` | Table without client_id FK | Add FK or drop table |
| `WRONG_PK_TYPE` | PK is not UUID | Migrate to UUID |
| `LATERAL_JOIN` | Join without client_id | Fix query |
| `UNREGISTERED_TABLE` | Table not in CTB registry | Register or drop |

### 5.2 Current Drift Status

| Type | Count | Notes |
|------|-------|-------|
| MISSING_CLIENT_ID | 0 | All tables compliant |
| WRONG_PK_TYPE | 0 | All UUIDs |
| LATERAL_JOIN | 0 | Not yet audited |
| UNREGISTERED_TABLE | 0 | All 13 registered |

---

## 6. CTB Phase History

| Phase | Tag | Date | Scope |
|-------|-----|------|-------|
| Constitutional Admission | v0.1.0 | 2026-01-30 | Initial governance files |
| Structural Instantiation | v1.0.0 | 2026-02-05 | Old multi-schema structure |
| Template Sync | v1.1.0 | 2026-02-09 | ARCHITECTURE.md v2.0.0 alignment |
| CTB Consolidation | v2.0.0 | 2026-02-11 | Single `clnt` schema, 12 tables, S1-S8 spokes |
| Renewal Sub-Hub | v2.1.0 | 2026-02-11 | +2 tables (S9), +3 views — SUPERSEDED by v2.2.0 |
| Plan Quote Support | v2.2.0 | 2026-02-11 | Renewal removed (ADR-004). +plan_quote under S2, -renewal_cycle, -renewal_error, -3 views. 13 tables |

---

## 7. Governance Rules

### 7.1 Table Creation

New tables must:
- Exist in `clnt` schema
- Include `client_id UUID NOT NULL REFERENCES clnt.client_hub(client_id)`
- Use UUID PK via `gen_random_uuid()`
- Be registered in this document
- Have an ADR

### 7.2 Table Modification

- **FROZEN**: Requires ADR + CC-02 approval
- **CANONICAL**: Normal DDL allowed
- **SUPPORT**: Status updates allowed, no structural changes without ADR
- **STAGING**: Flexible modification
- **AUDIT**: Append-only, no structural changes without ADR

### 7.3 Table Deletion

Tables should be deprecated before deletion:
1. Mark as DEPRECATED in registry
2. Schedule removal date
3. Migrate dependent queries
4. Drop after verification

---

## 8. Enforcement Rules

1. All writes occur at leaf tables only
2. Hub exposes read-only views
3. No lateral spoke joins without `client_id`
4. Intake → Vault is one-way
5. External identity mapping must never replace internal IDs
6. `audit_event` is append-only
7. Quote promotion copies rates into `plan` — plan is always self-contained

---

## 9. Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| ADR-002 | `docs/adr/ADR-002-ctb-consolidated-backbone.md` | Consolidation decision |
| ADR-003 | `docs/adr/ADR-003-renewal-subhub.md` | Renewal sub-hub (WITHDRAWN) |
| ADR-004 | `docs/adr/ADR-004-renewal-downgraded-to-plan-support.md` | Renewal downgraded to plan support |
| CTB Map | `docs/CTB_MAP.md` | Spoke structure and join contracts |
| ERD | `db/neon/migrations/SCHEMA_ER_DIAGRAM.md` | Visual schema diagrams |
| ERD Metrics | `erd/ERD_METRICS.yaml` | Runtime table metrics |
| Migration (backbone) | `db/neon/migrations/20_ctb_consolidated_backbone.sql` | Schema DDL |
| Migration (renewal — superseded) | `db/neon/migrations/25_add_renewal_subhub.sql` | Renewal sub-hub DDL (dropped by migration 30) |
| Migration (plan quote) | `db/neon/migrations/30_remove_renewal_add_plan_quote.sql` | Remove renewal, add plan_quote |
| Architecture Doctrine | `templates/doctrine/ARCHITECTURE.md` | CTB constitutional law |

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.2.0 |
| Created | 2026-02-09 |
| Last Modified | 2026-02-11 |
| Author | Claude Code |
| Status | ACTIVE |
| Review Cycle | Quarterly |
| Change Protocol | ADR REQUIRED |
