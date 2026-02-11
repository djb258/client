# ADR-003: Renewal Sub-Hub Addition [WITHDRAWN]

**WITHDRAWN** — Superseded by ADR-004-renewal-downgraded-to-plan-support. Renewal was removed as a sub-hub; quotes moved under Plan (S2).

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.0.0 |
| **CC Layer** | CC-03 |

---

## ADR Identity

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-003 |
| **Status** | [x] WITHDRAWN — Superseded by ADR-004 |
| **Date** | 2026-02-11 |

---

## Owning Hub (CC-02)

| Field | Value |
|-------|-------|
| **Sovereign ID** | imo-creator |
| **Hub Name** | Client Intake & Vendor Export System |
| **Hub ID** | client-subhive |

---

## CC Layer Scope

| Layer | Affected | Description |
|-------|----------|-------------|
| CC-01 (Sovereign) | [ ] | Not affected |
| CC-02 (Hub) | [x] | New sub-hub registered in CTB |
| CC-03 (Context) | [x] | 2 new leaf tables, 3 views, FK contracts |
| CC-04 (Process) | [ ] | No process changes |

---

## Context

The 12-table CTB backbone (ADR-002) provides the client infrastructure foundation. Renewal cycles — the annual process of reviewing, quoting, and binding benefit plans — need a home. Rather than adding multiple tables for every renewal concern, this ADR adds the minimum: one canonical table for cycle identity/lifecycle and one error table. All comparison and reporting logic lives in read-only views over existing `plan`, `person`, and `election` tables.

---

## Decision

**Add Renewal as a sub-hub (S9) with exactly 2 tables and 3 views.**

### New Tables

| Table | Type | Purpose |
|-------|------|---------|
| `clnt.renewal_cycle` | CANONICAL | Renewal cycle identity and lifecycle state |
| `clnt.renewal_error` | ERROR | Renewal-scoped error capture |

### New Views (read-only)

| View | Reads From | Purpose |
|------|------------|---------|
| `clnt.v_renewal_cycles_by_client` | `renewal_cycle`, `client_master` | Active/historical cycles per client |
| `clnt.v_renewal_plan_diff_summary` | `renewal_cycle`, `plan` | Rate differences between prior and new plan versions |
| `clnt.v_renewal_enrollment_snapshot_summary` | `renewal_cycle`, `election`, `person`, `plan` | Enrollment counts by tier for a renewal cycle |

### Design Rules

1. `renewal_cycle` owns only cycle identity and lifecycle state
2. All plan/enrollment comparisons are views — no denormalized snapshot tables
3. `renewal_error` captures errors scoped to a cycle (nullable FK allows orphan errors)
4. No modifications to existing backbone tables
5. Unique active cycle enforced: one non-archived cycle per `(client_id, renewal_year)`

### What Was NOT Added

| Excluded | Reason |
|----------|--------|
| Underwriting tables | Out of scope for this pass |
| Claims/invoices | Separate sub-hub (future) |
| Document storage (SPD/SBC) | Separate sub-hub (future) |
| Messaging tables | Not a renewal concern |
| Snapshot/history tables | Views over existing data are sufficient |

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|----------------|
| Separate renewal schema | Violates single-schema consolidation (ADR-002) |
| Materialized views | Premature optimization; standard views are sufficient |
| Denormalized snapshot tables | Table bloat; views serve the same purpose |
| Adding columns to plan table | Mixes concerns; plan is plan, renewal is lifecycle |

---

## Consequences

### Enables

- Tracking renewal cycles through draft → quoted → selected → bound → archived
- Comparing prior vs new plan rates via views
- Error capture scoped to specific renewal cycles
- Dashboard support without new canonical tables

### Prevents

- Table bloat (2 tables, not 5+)
- Denormalized data drift
- Modification of existing backbone tables

---

## Guard Rails

| Type | Value | CC Layer |
|------|-------|----------|
| FK Enforcement | `renewal_cycle.client_id` → `client_hub.client_id` | CC-03 |
| FK Enforcement | `renewal_error.client_id` → `client_hub.client_id` | CC-03 |
| FK Enforcement | `renewal_error.renewal_cycle_id` → `renewal_cycle.renewal_cycle_id` | CC-03 |
| CHECK Constraint | `renewal_cycle.status` in (draft, quoted, selected, bound, archived) | CC-03 |
| CHECK Constraint | `renewal_cycle.source` in (quote, manual, migration) | CC-03 |
| Unique Constraint | One non-archived cycle per (client_id, renewal_year) | CC-03 |

---

## Rollback

Drop the 3 views, then the 2 tables. No data migration. No impact on existing 12 tables.

```sql
DROP VIEW IF EXISTS clnt.v_renewal_enrollment_snapshot_summary;
DROP VIEW IF EXISTS clnt.v_renewal_plan_diff_summary;
DROP VIEW IF EXISTS clnt.v_renewal_cycles_by_client;
DROP TABLE IF EXISTS clnt.renewal_error;
DROP TABLE IF EXISTS clnt.renewal_cycle;
```

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Migration | `db/neon/migrations/25_add_renewal_subhub.sql` |
| Backbone ADR | `docs/adr/ADR-002-ctb-consolidated-backbone.md` |
| CTB Map | `docs/CTB_MAP.md` |
| ERD | `db/neon/migrations/SCHEMA_ER_DIAGRAM.md` |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Hub Owner (CC-02) | Barton Ops System | 2026-02-11 |
| Reviewer | Pending | |
