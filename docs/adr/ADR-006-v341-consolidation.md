# ADR-006: v3.4.1 Schema Consolidation

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 3.4.1 |
| **CC Layer** | CC-02 / CC-03 |

---

## ADR Identity

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-006 |
| **Status** | [x] Accepted |
| **Date** | 2026-02-25 |

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
| CC-02 (Hub) | [x] | Spoke count reduced (8 → 5), SPINE table merged, governance files updated |
| CC-03 (Context) | [x] | Table merges, drops, renames, 6 new tables, FK re-pointing |
| CC-04 (Process) | [ ] | No process changes |

---

## Context

After ADR-002 (12 tables, 8 spokes) and incremental ADRs 003–005, the schema had accumulated structural debt:

1. **Identity fragmentation** — client identity was split across three tables (`client_hub`, `client_master`, `client_projection`) that were always 1:1 and always queried together. Every join started with a 3-way join.

2. **Too many spokes** — The original 8-spoke layout (S1 Hub, S2 Plan, S3 Intake, S4 Vault, S5 Vendor, S6 Service, S7 Compliance, S8 Audit) included two spokes with only one table each (`compliance_flag`, `audit_event`). Neither had been populated. Neither served the Transformation Law — compliance flags and audit events are cross-cutting concerns, not client intake or vendor export.

3. **Missing error tracking** — OWN-10b requires one ERROR table per spoke. Zero error tables existed.

4. **Naming inconsistency** — `intake_batch` conflicted with the spoke rename from "Intake" to "Employee". The batch header needed a name aligned with its domain.

5. **No enforcement infrastructure** — Registry-first architecture was documented but not enforced. No codegen, no gate scripts, no drift audits.

The doctrine upgrade from v2.1.0 to v3.4.1 (via imo-creator) introduced OWN-10a/10b/10c cardinality rules, registry-first enforcement, and the V1 Control Plane — all of which required a structural realignment.

---

## Decision

**Consolidate the `clnt` schema from 12 tables / 8 spokes / 1 view to 16 tables / 5 spokes / 0 views.**

This is a single atomic migration (`45_v341_consolidation.sql`) covering 10 changes.

### 1. Merge client tables into SPINE

`client_hub` + `client_master` + `client_projection` → `client`

| Source Table | Columns Absorbed | Notes |
|-------------|------------------|-------|
| `client_hub` | `client_id` (PK), `status`, `source`, `version`, `created_at` | Root identity |
| `client_master` | `legal_name`, `fein`, `domicile_state`, `effective_date` | Business details |
| `client_projection` | `domain`, `label_override`, `logo_url`, `color_primary`, `color_accent`, `feature_flags`, `dashboard_blocks` | UI config (ADR-005) |

Data migrated via `INSERT ... SELECT ... LEFT JOIN`. The merged `client` table is the S1 SPINE — the sovereign identity anchor. All 15 other tables FK to `client.client_id`.

### 2. Re-point all foreign keys

9 tables had FKs referencing `client_hub`. All re-pointed to `client`:

`plan`, `plan_quote`, `intake_batch`, `intake_record`, `person`, `election`, `vendor`, `external_identity_map`, `service_request`

### 3. Drop deprecated tables and view

| Dropped | Reason |
|---------|--------|
| `client_hub` | Merged into `client` |
| `client_master` | Merged into `client` |
| `client_projection` | Merged into `client` |
| `compliance_flag` | Zero rows, not in transformation scope, no spoke justification |
| `audit_event` | Zero rows, cross-cutting concern, not hub-specific |
| `v_client_dashboard` | Superseded by direct `client` table (all fields now in one table) |

### 4. Rename `intake_batch` → `enrollment_intake`

- Table renamed: `intake_batch` → `enrollment_intake`
- PK renamed: `intake_batch_id` → `enrollment_intake_id`
- FK in `intake_record` re-pointed: `intake_batch_id` → `enrollment_intake_id`
- Indexes and triggers renamed to match

### 5. Add 5 error tables (OWN-10b)

Each spoke gets exactly one ERROR table with a uniform schema:

| Error Table | Spoke | PK |
|-------------|-------|----|
| `client_error` | S1 Hub | `client_error_id` |
| `plan_error` | S2 Plan | `plan_error_id` |
| `employee_error` | S3 Employee | `employee_error_id` |
| `vendor_error` | S4 Vendor | `vendor_error_id` |
| `service_error` | S5 Service | `service_error_id` |

All error tables share: `error_code TEXT NOT NULL`, `error_message TEXT`, `severity CHECK (low/medium/high/critical)`, `status CHECK (open/acknowledged/resolved/dismissed)`, `source_entity_id UUID`, `context JSONB`, `created_at TIMESTAMPTZ`. Append-only by convention.

### 6. Add `invoice` table (S4 SUPPORT)

New SUPPORT table under S4 Vendor. FKs to both `client` and `vendor`. Columns: `invoice_number`, `amount NUMERIC(12,2)`, `due_date DATE`, `status CHECK (draft/sent/paid/overdue/cancelled)`.

### 7. Consolidate spokes (8 → 5)

| v3.4.1 Spoke | Tables | Cardinality |
|--------------|--------|-------------|
| **S1 Hub** | `client` (CANONICAL), `client_error` (ERROR) | 1C + 1E |
| **S2 Plan** | `plan` (CANONICAL), `plan_error` (ERROR), `plan_quote` (SUPPORT) | 1C + 1E + 1S |
| **S3 Employee** | `person` (CANONICAL), `employee_error` (ERROR), `election` (SUPPORT), `enrollment_intake` (STAGING), `intake_record` (STAGING) | 1C + 1E + 1S + 2ST |
| **S4 Vendor** | `vendor` (CANONICAL), `vendor_error` (ERROR), `external_identity_map` (SUPPORT), `invoice` (SUPPORT) | 1C + 1E + 2S |
| **S5 Service** | `service_request` (CANONICAL), `service_error` (ERROR) | 1C + 1E |

**Eliminated spokes:** S6 (Service — merged into S5), S7 (Compliance — dropped), S8 (Audit — dropped). Former S3 "Intake" and S4 "Vault" consolidated into S3 "Employee".

### 8. Update CTB registry

`ctb.table_registry` cleared and re-populated with 16 tables. Promotion paths registered:

| Source | Target | Flow |
|--------|--------|------|
| `intake_record` | `person` | Raw enrollment → canonical employee |
| `intake_record` | `election` | Raw enrollment → benefit election |
| `plan_quote` | `plan` | Selected quote → active plan |

### Final State

| Metric | Before (ADR-002 + 003–005) | After (v3.4.1) |
|--------|---------------------------|-----------------|
| Tables | 14 | 16 |
| Views | 1 | 0 |
| Spokes | 8 | 5 |
| Error tables | 0 | 5 |
| CANONICAL tables | 5 | 5 |
| Client identity tables | 3 | 1 (SPINE) |
| Schemas | `clnt` | `clnt` (unchanged) |

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|----------------|
| Keep 3 separate client tables | Unnecessary joins for every query; 1:1 cardinality means one table |
| Keep compliance_flag and audit_event | Zero rows, not in transformation scope, no spoke justification under OWN-10 |
| Keep the view | View existed to join 3 client tables — merge eliminates the need |
| Add error tables incrementally (per ADR) | OWN-10b is structural law, not optional; all 5 added at once for consistency |
| Keep 8-spoke layout | Spokes S7/S8 had one table each with zero rows; consolidation matches actual data domains |
| Run enforcement scripts without registry infrastructure | Migration 40 provides the `ctb` schema; enforcement requires registry to validate against |

---

## Consequences

### Enables

- Every query on client identity is a single-table read (no 3-way join)
- OWN-10a/10b cardinality satisfied: every spoke has exactly 1 CANONICAL + 1 ERROR
- Error tracking per domain for intake validation, plan checking, vendor sync
- Registry-first codegen: `clnt_column_registry.yml` → generated `types.ts` + `schema.ts`
- Automated enforcement via 5 gate scripts (registry gate, drift audit, banned DB clients, governance CI, bootstrap audit)
- V1 Control Plane agents can validate changes against registered schema

### Prevents

- Identity fragmentation (single SPINE table)
- Orphan spokes with zero-row tables
- Missing error sinks (all 5 domains covered)
- Naming drift (`enrollment_intake` aligns with S3 Employee domain)
- Views masking structural problems

---

## Guard Rails

| Type | Value | CC Layer |
|------|-------|----------|
| FK Enforcement | All 15 non-SPINE tables FK to `client.client_id` | CC-03 |
| UUID Constraint | All PKs are UUID via `gen_random_uuid()` | CC-03 |
| OWN-10 Cardinality | 5 CANONICAL + 5 ERROR + 4 SUPPORT + 2 STAGING = 16 | CC-02 |
| Error Severity | CHECK constraint: `low/medium/high/critical` | CC-03 |
| Error Status | CHECK constraint: `open/acknowledged/resolved/dismissed` | CC-03 |
| Invoice Status | CHECK constraint: `draft/sent/paid/overdue/cancelled` | CC-03 |
| Registry Gate | `scripts/ctb-registry-gate.sh` validates registry vs migration | CC-02 |
| Drift Audit | `scripts/ctb-drift-audit.sh` validates live DB vs registry | CC-02 |

---

## Rollback

Migration 45 is atomic (wrapped in `BEGIN/COMMIT`). Rollback requires:

1. Re-create `client_hub`, `client_master`, `client_projection` from `client` data
2. Re-point all FKs back to `client_hub`
3. Drop the 5 error tables and `invoice`
4. Rename `enrollment_intake` back to `intake_batch`
5. Re-create `compliance_flag`, `audit_event`, `v_client_dashboard`
6. Drop `client` table

Practical rollback risk: **low**. All dropped tables had 0 rows at time of migration. No data loss is possible beyond newly inserted rows.

---

## Supersedes

| ADR | Status | Reason |
|-----|--------|--------|
| ADR-002 | Superseded by this ADR | Spoke structure replaced (8 → 5), table inventory replaced |
| ADR-003 | Withdrawn (by ADR-004) | Renewal sub-hub never created |
| ADR-004 | Absorbed | `plan_quote` retained as S2 SUPPORT — no structural change |
| ADR-005 | Absorbed | `client_projection` merged into `client` SPINE — columns preserved |

ADR-001 (foundational architecture decisions) remains in force. CTB, IMO, Neon, Doppler, CC hierarchy — all unchanged.

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Migration | `db/neon/migrations/45_v341_consolidation.sql` |
| Registry infrastructure | `db/neon/migrations/40_ctb_registry_infrastructure.sql` |
| Column registry | `src/data/db/registry/clnt_column_registry.yml` |
| Codegen script | `scripts/codegen-schema.ts` |
| CTB governance | `docs/CTB_GOVERNANCE.md` |
| Registry gate | `scripts/ctb-registry-gate.sh` |
| Drift audit | `scripts/ctb-drift-audit.sh` |
| Previous backbone | `docs/adr/ADR-002-ctb-consolidated-backbone.md` |
| Doctrine | `DOCTRINE.md` (v3.4.1) |
| IMO Control | `IMO_CONTROL.json` |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Hub Owner (CC-02) | Barton Ops System | 2026-02-25 |
| Reviewer | Pending | |
