# ADR-004: Renewal Downgraded from Sub-Hub to Plan Support

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.0.0 |
| **CC Layer** | CC-03 |

---

## ADR Identity

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-004 |
| **Status** | [x] Accepted |
| **Date** | 2026-02-11 |
| **Supersedes** | ADR-003-renewal-subhub (withdrawn) |

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
| CC-02 (Hub) | [x] | Renewal removed as sub-hub; Plan sub-hub extended |
| CC-03 (Context) | [x] | 2 tables dropped, 3 views dropped, 1 table added, 1 column added |
| CC-04 (Process) | [ ] | No process changes |

---

## Context

ADR-003 introduced Renewal as a standalone sub-hub (S9) with `renewal_cycle` and `renewal_error`. On review, renewal is not its own domain — it is comparison context for plans. A renewal cycle is just the process of receiving quotes and promoting one to a new plan row. This does not justify a separate identity domain.

The correct model: quotes are support data under Plan. The `plan` table remains canonical. Quotes live in `plan_quote`. Promotion copies rates from a selected quote into a new `plan` row with a `source_quote_id` FK for lineage.

---

## Decision

**Remove Renewal as sub-hub. Add `plan_quote` as support table under Plan (S2). Add `source_quote_id` to `plan` for promotion lineage.**

### Removed

| Object | Type | Reason |
|--------|------|--------|
| `clnt.renewal_cycle` | Table | Renewal is not its own domain |
| `clnt.renewal_error` | Table | Errors captured via audit_event instead |
| `clnt.v_renewal_cycles_by_client` | View | Dependent on dropped table |
| `clnt.v_renewal_plan_diff_summary` | View | Dependent on dropped table |
| `clnt.v_renewal_enrollment_snapshot_summary` | View | Dependent on dropped table |
| S9 spoke designation | Docs | Sub-hub removed from CTB |

### Added

| Object | Type | Purpose |
|--------|------|---------|
| `clnt.plan_quote` | Table (support) | Received quotes. Multiple per benefit/year allowed. |
| `clnt.plan.source_quote_id` | Column (nullable FK) | Lineage: which quote was promoted into this plan row |

### Design Rules

1. `plan_quote` allows multiple rows per `(client_id, benefit_type, effective_year)` — no uniqueness constraint
2. Promotion = copy rates from selected quote into new `plan` row + set `source_quote_id`
3. `plan` remains the single source of truth for active rates
4. Plans created without quotes have `source_quote_id = NULL`
5. Quote status lifecycle: `received` → `presented` → `selected` or `rejected`
6. Exactly one quote per benefit per cycle should reach `selected` — enforced operationally, not by constraint

### Promotion Flow

```
plan_quote (received) → presented → selected
                                      ↓
                               INSERT INTO plan (
                                 rates copied from quote,
                                 source_quote_id = plan_quote_id
                               )
```

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|----------------|
| Keep Renewal as sub-hub | Renewal is not its own identity domain |
| Reference plan_quote_id without copying rates | Plan would need a join to read rates — violates self-containment |
| Store quote snapshot as JSON in plan | Breaks column typing, harder to query |
| Track lineage in audit_event only | Audit is append-only log, not a FK — weaker lineage |

---

## Consequences

### Enables

- Clean quote intake: multiple carriers, multiple quotes per benefit per year
- Deterministic promotion: copy rates + FK reference
- Plan remains self-contained (no joins to read active rates)
- Quote history preserved permanently in `plan_quote`

### Prevents

- Sub-hub sprawl (Renewal is not a domain)
- Rate desync (plan always has its own rates)
- Orphaned renewal identity tables

---

## Guard Rails

| Type | Value | CC Layer |
|------|-------|----------|
| FK Enforcement | `plan_quote.client_id` → `client_hub.client_id` | CC-03 |
| FK Enforcement | `plan.source_quote_id` → `plan_quote.plan_quote_id` | CC-03 |
| CHECK Constraint | `plan_quote.status` in (received, presented, selected, rejected) | CC-03 |
| Operational Rule | One `selected` quote per benefit per cycle (not DB-enforced) | CC-04 |

---

## Rollback

```sql
ALTER TABLE clnt.plan DROP COLUMN IF EXISTS source_quote_id;
DROP TABLE IF EXISTS clnt.plan_quote;
-- Optionally re-run 25_add_renewal_subhub.sql to restore renewal sub-hub
```

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Migration | `db/neon/migrations/30_remove_renewal_add_plan_quote.sql` |
| Superseded ADR | `docs/adr/ADR-003-renewal-subhub.md` (withdrawn) |
| Backbone ADR | `docs/adr/ADR-002-ctb-consolidated-backbone.md` |
| CTB Map | `docs/CTB_MAP.md` |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Hub Owner (CC-02) | Barton Ops System | 2026-02-11 |
| Reviewer | Pending | |
