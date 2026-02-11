# ADR-002: CTB Consolidated Client Infrastructure Backbone

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.0.0 |
| **CC Layer** | CC-03 |

---

## ADR Identity

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-002 |
| **Status** | [x] Accepted |
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
| CC-02 (Hub) | [x] | Schema consolidation from multi-schema to single `clnt` schema |
| CC-03 (Context) | [x] | New spoke structure (S1-S8), FK contracts |
| CC-04 (Process) | [x] | Audit event table replaces lineage tracking |

---

## Context

The previous schema existed in two incomplete generations:

1. **Old migrations (10-15)**: Used `core`, `benefits`, `compliance`, `operations`, `staging` sub-schemas with TEXT PKs and doctrine metadata columns. Never deployed (0 rows).
2. **Skeleton schema (clnt2)**: UUID PKs but no business columns. Never deployed (0 rows).

Both generations suffered from:
- Schema fragmentation (5+ schemas for one hub)
- Unnecessary normalization (separate plan_cost table)
- TEXT primary keys in old migrations
- Doctrine metadata columns (`column_number`, `column_description`, `column_format`) on every table adding noise
- No enforced `client_id` as universal FK
- Missing vendor identity translation layer

---

## Decision

**Consolidate all client infrastructure into a single `clnt` schema with 12 tables organized by CTB spoke (S1-S8).**

### Schema: `clnt`

| Spoke | Table | Purpose |
|-------|-------|---------|
| S1 Hub | `client_hub` | Root identity, read-only after creation |
| S1 Master | `client_master` | Client legal/business details |
| S2 Plan | `plan` | Consolidated plan with fixed cost tiers |
| S3 Intake | `intake_batch` | Batch upload metadata |
| S3 Intake | `intake_record` | Individual raw intake records |
| S4 Vault | `person` | Employee/dependent identity |
| S4 Vault | `election` | Benefit elections (bridge to plan + person) |
| S5 Vendor | `vendor` | Vendor identity |
| S5 Vendor | `external_identity_map` | Internal-to-external ID translation |
| S6 Service | `service_request` | Service ticket tracking |
| S7 Compliance | `compliance_flag` | Compliance flag tracking |
| S8 Audit | `audit_event` | System audit trail |

### Key Design Rules

1. **`client_id` is sovereign** — every table includes `client_id` as FK to `client_hub`
2. **UUID PKs only** — no TEXT PKs, no SERIAL, no composite PKs
3. **Fixed cost tiers in plan** — `rate_ee/es/ec/fam` + `employer_rate_ee/es/ec/fam` embedded. No separate `plan_cost` table
4. **Person and election are separate** — bridge table pattern preserved
5. **External identity mapping** — vendor IDs never replace internal UUIDs
6. **Leaf-only writes** — hub is read-only; views expose aggregated reads
7. **No doctrine metadata columns** — removed `column_number`, `column_description`, `column_format`

### What Was Eliminated

| Eliminated | Reason |
|------------|--------|
| `clnt2` schema (12 skeleton tables) | Replaced by `clnt` schema |
| `core` schema | Consolidated into S1 |
| `benefits` schema | Consolidated into S2/S5 |
| `compliance` schema | Consolidated into S7 |
| `operations` schema | Consolidated into S8 |
| `staging` schema | Consolidated into S3 |
| `plan_cost` table | Rates embedded in `plan` (fixed tiers) |
| `clnt_m_spd` table | SPD/document storage deferred |
| `clnt_o_output` / `clnt_o_output_run` | Vendor export is a separate concern |
| `entity_relationship` table | Unnecessary normalization |
| Doctrine metadata columns | Noise; governance tracked in docs, not columns |

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|----------------|
| Keep multi-schema approach | Fragmentation, harder joins, identity drift |
| Keep `clnt2` skeleton and add columns | Wrong naming convention, no spoke structure |
| Separate `plan_cost` table | Fixed 4-tier structure doesn't justify a join |
| Merge person + election | Violates bridge table pattern; different cardinality |

---

## Consequences

### Enables

- Single `client_id` join path across all tables
- Deterministic spoke-based file/table placement
- Clean leaf separation (writes at leaves, reads at hub)
- Vendor identity translation without ID contamination
- Minimal table count (12 tables)

### Prevents

- Schema fragmentation
- Lateral joins without `client_id`
- Intake-to-vault data leakage (one-way flow)
- External IDs replacing internal UUIDs

---

## PID Impact (CC-04)

| Field | Value |
|-------|-------|
| **New PID required** | [ ] No |
| **PID pattern change** | [ ] No |
| **Audit trail impact** | `clnt.audit_event` replaces `operations.audit_data_lineage` |

---

## Guard Rails

| Type | Value | CC Layer |
|------|-------|----------|
| FK Enforcement | All tables FK to `client_hub.client_id` | CC-03 |
| UUID Constraint | All PKs are UUID via `gen_random_uuid()` | CC-03 |
| Leaf Write Rule | Hub table is read-only after creation | CC-02 |
| Intake Isolation | `intake_record` → vault is one-way | CC-03 |

---

## Rollback

All previous schemas had 0 rows. No data migration required. Rollback = drop `clnt` schema, re-run old migrations if needed.

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Migration | `db/neon/migrations/20_ctb_consolidated_backbone.sql` |
| CTB Map | `docs/CTB_MAP.md` |
| ERD | `db/neon/migrations/SCHEMA_ER_DIAGRAM.md` |
| Previous ADR | `docs/adr/ADR-001-architecture.md` |
| Bootstrap Guide | `CLAUDE.md` |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Hub Owner (CC-02) | Barton Ops System | 2026-02-11 |
| Reviewer | Pending | |
