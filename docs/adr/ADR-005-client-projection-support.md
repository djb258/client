# ADR-005: Client Projection Support

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.1.0 |
| **CC Layer** | CC-03 |

---

## ADR Identity

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-005 |
| **Status** | [x] Accepted |
| **Date** | 2026-02-15 |

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
| CC-02 (Hub) | [ ] | Not affected |
| CC-03 (Context) | [x] | 1 SUPPORT table added, 1 view added under S1 |
| CC-04 (Process) | [ ] | No process changes |

---

## OWN-10c Justification

S1 (Hub) already has its two core tables:

| Table | Leaf Type | Status |
|-------|-----------|--------|
| `client_hub` | FROZEN | Existing (migration 20) |
| `client_master` | CANONICAL | Existing (migration 20) |

Per OWN-10a/10b, each spoke gets exactly one CANONICAL table and one ERROR table. Per OWN-10c, additional table types (STAGING, MV, REGISTRY, SUPPORT) require ADR justification. This ADR provides that justification for one SUPPORT table.

---

## Context

The client-subhive UI will be built by lovable.dev. The UI needs per-client configuration data that does not exist in any current table:

- **Domain mapping**: which custom domain resolves to which client
- **Branding**: logo, primary color, accent color
- **Feature flags**: which capabilities are enabled per client
- **Dashboard blocks**: which UI blocks render on the client dashboard

This data is 1:1 with `client_id`. It is projection/presentation configuration — not canonical business data, not identity, not an election or plan. It does not belong in `client_master` (which stores legal/business details) or any other existing table.

Without this table, lovable.dev has no query surface for multi-tenant rendering. Each client would need hardcoded configuration or environment variables, violating both multi-tenancy and the Transformation Law.

---

## Decision

**Add `client_projection` as a SUPPORT table under S1. Add `v_client_dashboard` as a read-only view.**

### Added

| Object | Type | Purpose |
|--------|------|---------|
| `clnt.client_projection` | Table (SUPPORT) | Per-client UI projection configuration |
| `clnt.v_client_dashboard` | View | Read-only query surface joining hub + master + projection |

### Table: `client_projection`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `client_id` | UUID PK | NOT NULL | | FK to `client_hub` (1:1) |
| `domain` | TEXT | NULL | | Custom domain mapping |
| `label_override` | TEXT | NULL | | Display name override |
| `logo_url` | TEXT | NULL | | Branding: logo URL |
| `color_primary` | TEXT | NULL | | Branding: primary color hex |
| `color_accent` | TEXT | NULL | | Branding: accent color hex |
| `feature_flags` | JSONB | NOT NULL | `'{}'` | Feature toggles |
| `dashboard_blocks` | JSONB | NOT NULL | `'[]'` | Block configuration for UI rendering |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Auto-updated via trigger |

### View: `v_client_dashboard`

Joins `client_hub`, `client_master`, and `client_projection` into a single read-only surface for lovable.dev. Returns: `client_id`, `status`, `legal_name`, `domicile_state`, `domain`, `label_override`, `logo_url`, `color_primary`, `color_accent`, `feature_flags`, `dashboard_blocks`.

### Design Rules

1. `client_projection` is 1:1 with `client_hub` — PK is FK
2. All columns except `client_id`, `feature_flags`, `dashboard_blocks`, and timestamps are nullable (progressive fill)
3. `feature_flags` defaults to empty object `{}` — all features disabled by default
4. `dashboard_blocks` defaults to empty array `[]` — no blocks rendered by default
5. The view is the primary query surface for the UI — lovable.dev should query `v_client_dashboard`, not the individual tables
6. `client_projection` is a SUPPORT table — not a query surface for business questions

### Why One Table, Not Five

The original proposal had 5 tables (domain_map, branding, permission_set, dashboard_layout, support_table_registry). Consolidation rationale:

| Factor | Reasoning |
|--------|-----------|
| Cardinality | All data is 1:1 with client_id — same cardinality = same table |
| OWN-10c | Fewer additional tables = less justification burden |
| JSONB flexibility | `feature_flags` and `dashboard_blocks` give lovable.dev flexibility without schema changes |
| Lovable.dev contract | The view provides a single query surface — simpler integration |

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|----------------|
| Add columns to `client_master` | `client_master` is legal/business identity — UI config is presentation, not identity |
| 5 separate tables | Violates structural minimalism; all data is 1:1 with client_id |
| Store config in Doppler environment | Per-client config is data, not secrets — belongs in the database |
| Let lovable.dev manage its own config | UI owns no persistence (UI_CONSTITUTION.md) — data lives in the hub |
| JSONB-only (single column) | Loses column-level indexing on domain; harder to query branding individually |

---

## Consequences

### Enables

- lovable.dev can query `v_client_dashboard` for all rendering configuration
- Multi-tenant UI without per-client forks, schemas, or deployments
- Progressive fill — clients start with defaults, customize over time
- Feature flags enable/disable capabilities without code changes

### Prevents

- Hardcoded per-client configuration in environment variables
- UI owning its own persistence layer (violates UI_CONSTITUTION.md)
- Table sprawl under S1 (1 SUPPORT table instead of 5)

---

## Guard Rails

| Type | Value | CC Layer |
|------|-------|----------|
| FK Enforcement | `client_projection.client_id` -> `client_hub.client_id` | CC-03 |
| Default Safety | `feature_flags` defaults to `{}` (all off) | CC-03 |
| Default Safety | `dashboard_blocks` defaults to `[]` (nothing rendered) | CC-03 |
| View Contract | `v_client_dashboard` is read-only (SELECT only) | CC-03 |

---

## Rollback

```sql
DROP VIEW IF EXISTS clnt.v_client_dashboard;
DROP TABLE IF EXISTS clnt.client_projection;
```

No downstream data impact beyond losing projection configuration.

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Migration | `db/neon/migrations/35_client_projection.sql` |
| Backbone ADR | `docs/adr/ADR-002-ctb-consolidated-backbone.md` |
| Doctrine Rule | ARCHITECTURE.md Part X §3 OWN-10c |
| Sovereign ADR | `templates/adr/ADR-001-subhub-table-cardinality.md` |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Hub Owner (CC-02) | Barton Ops System | 2026-02-15 |
| Reviewer | Pending | |
