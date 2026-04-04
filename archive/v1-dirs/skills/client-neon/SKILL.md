---
name: client-neon
description: >
  Neon PostgreSQL vault/archive configuration, schema topology, and operational patterns for
  the Client Intake & Vendor Export System — 5 spokes, 16 tables in the clnt schema,
  serverless driver over pooled connections, Doppler-managed secrets, Zod-validated intake
  pipeline, and vendor export egress. Neon serves as the vault/archive layer; CF D1/KV is the
  working database. Use this skill whenever querying, migrating, debugging, or making
  data-layer decisions about the Neon vault in the client repo. Trigger on: Neon, PostgreSQL,
  clnt schema, client_id, enrollment intake, vendor export, plan quote, election, invoice,
  spoke tables, column registry, codegen, promote-to-neon, or any reference to the vault
  database layer. Also trigger when discussing connection strings, migration scripts, error
  tables, staging tables, or the intake-to-canonical promotion pipeline.
---

# Client-Neon — Car Skill

Neon is the vault/archive persistence layer for the Client Intake & Vendor Export System.
CF D1/KV serves as the working database for active operations. The clnt schema (16 tables,
5-spoke CTB topology) lives in Neon for archival and canonical storage. The serverless driver
(`@neondatabase/serverless ^0.10.0`) connects via pooled endpoint. Secrets come from
Doppler (project: `barton-outreach-core`, config: `dev`).

**Master skill reference:** `IMO-Creator/skills/neon/SKILL.md`

## What This Repo Uses

| Component | Value |
|-----------|-------|
| Database (vault/archive) | Neon Serverless PostgreSQL |
| Database (working) | CF D1/KV |
| Schema | `clnt` |
| Driver | `@neondatabase/serverless` ^0.10.0 |
| Connection secret | `NEON_DATABASE_URL` via Doppler |
| Doppler project | `barton-outreach-core` / config: `dev` |
| Hub ID secret | `HUB_ID` via Doppler |
| Secrets provider | Doppler |
| Total tables | 16 (5 CANONICAL, 5 ERROR, 3 SUPPORT, 2 STAGING, 1 view) |
| Universal join key | `client_id` (UUID, FK to `clnt.client`) |
| Spine table | `clnt.client` |
| Codegen source | `src/data/db/registry/clnt_column_registry.yml` |
| Codegen command | `npm run codegen` (`tsx scripts/codegen-schema.ts`) |
| Migration runner | `npm run migrate` (`tsx scripts/run_migrations_via_mcp.ts`) |
| Validation | Zod schemas (generated, not hand-edited) |

## Connection Configuration

Connection strings are sourced exclusively from Doppler. No `.env` files exist in this repo.

```
# Pooled (application traffic) — used by the serverless driver
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Direct (migrations, pg_dump, admin) — no -pooler suffix
# Used by: npm run migrate, manual admin
```

**Rules:**
- Application code uses the pooled endpoint only (via `NEON_DATABASE_URL`)
- Migrations use direct connection (no PgBouncer — needs session features)
- Never hardcode connection strings. Doppler is the single source
- The serverless driver's `neon()` HTTP mode is used for one-shot queries
- No Cloudflare Hyperdrive in this repo — use `@neondatabase/serverless` directly

## Schema / Data Model

5 spokes organized under the CTB Hub-Spoke architecture:

| Spoke | Name | CANONICAL Table | ERROR Table | Additional Tables |
|-------|------|----------------|-------------|-------------------|
| S1 | Hub (SPINE) | `clnt.client` | `clnt.client_error` | -- |
| S2 | Plan | `clnt.plan` | `clnt.plan_error` | `clnt.plan_quote` (SUPPORT) |
| S3 | Employee | `clnt.person` | `clnt.employee_error` | `clnt.election` (SUPPORT), `clnt.enrollment_intake` (STAGING), `clnt.intake_record` (STAGING) |
| S4 | Vendor | `clnt.vendor` | `clnt.vendor_error` | `clnt.external_identity_map` (SUPPORT), `clnt.invoice` (SUPPORT) |
| S5 | Service | `clnt.service_request` | `clnt.service_error` | -- |

**View:** `v_client_dashboard` — joins client + projection data for UI rendering.

Every table carries `client_id` as the universal join key back to the spine (`clnt.client`).

For full table schemas with column details, see `references/schema.md`.

## Operational Patterns

### Intake Pipeline (Ingress)

1. Raw data arrives via API intake endpoint (Zod-validated at ingress)
2. Data lands in STAGING tables: `clnt.enrollment_intake` + `clnt.intake_record`
3. `intake_record.raw_payload` holds the unstructured JSON payload
4. Middle layer validates, transforms, and promotes to CANONICAL tables
5. Errors are captured in per-spoke ERROR tables with severity/status lifecycle

```
API Request → Zod validation → enrollment_intake (STAGING) → intake_record (STAGING)
  → Transform/Validate → person, election, plan (CANONICAL)
  → Errors → employee_error, plan_error, etc. (ERROR)
```

### Quote Promotion Pipeline

1. Quotes arrive in `clnt.plan_quote` (SUPPORT) with status lifecycle: `received → presented → selected → rejected`
2. Selected quotes promote to `clnt.plan` (CANONICAL) via `npm run promote`
3. `clnt.plan.source_quote_id` tracks promotion lineage back to the originating quote
4. Script: `scripts/promote_to_neon.ts`

### Vendor Export Pipeline (Egress)

1. Internal entities are mapped to vendor-specific IDs via `clnt.external_identity_map`
2. Export reads CANONICAL tables + identity maps
3. Output follows `vendor_output_blueprint` schema contract
4. Script: `npm run export:run` (`scripts/run_vendor_export.ts`)
5. Invoices tracked in `clnt.invoice` (SUPPORT) with status: `received → approved → paid → disputed`

### Error Monitoring

Each spoke has a dedicated ERROR table. All share the same schema pattern:
- `client_id`, `source_entity`, `source_id`, `error_code`, `error_message`
- `severity` CHECK: `warning`, `error`, `critical`
- `status` CHECK: `open`, `resolved`, `dismissed`
- `context` JSONB for additional metadata

Error management scripts:
- `npm run errors:check` — all errors
- `npm run errors:unresolved` — open errors only
- `npm run errors:critical` — critical severity
- `npm run errors:summary` — counts by spoke/severity
- `npm run errors:recent` — last N errors

### Codegen Pipeline

Schema changes follow a registry-first workflow:
1. Edit `src/data/db/registry/clnt_column_registry.yml` (source of truth)
2. Run `npm run codegen` to regenerate Zod schemas in `src/data/spokes/*/schema.ts`
3. Run `npm run codegen:verify` to validate generated output matches registry
4. Generated files are guarded: `npm run codegen:guard` detects hand-edits

**Never hand-edit generated schema files.** They are overwritten on every codegen run.

## Known Issues

- **Vault role**: Neon is vault/archive only. Active working data lives in CF D1/KV. Neon handles canonical archival, historical queries, and migration-managed schema
- **Cold starts**: Neon scale-to-zero means first query after idle period has latency. The serverless driver's HTTP mode (`neon()`) handles this gracefully for one-shot queries
- **Transaction mode pooling**: PgBouncer in transaction mode means `SET` statements, temp tables, and advisory locks do not persist between transactions
- **No superuser**: Neon provides `neon_superuser` role, not full superuser. Some extensions and `CREATE TABLESPACE` are unavailable
- **Codegen drift**: If someone hand-edits a generated schema file, `codegen:guard` will catch it — but only if run. CI should enforce this

## Cost Profile

| Resource | Tier | Notes |
|----------|------|-------|
| Neon compute | Free tier (100 CU-hr/mo) | Scale-to-zero keeps costs minimal for dev |
| Neon storage | Free tier (0.5 GB) | 16 tables, moderate row counts fit comfortably |
| Doppler | Free tier | Secrets management for NEON_DATABASE_URL, HUB_ID |
| `@neondatabase/serverless` | OSS (free) | npm dependency, no license cost |

If storage exceeds 0.5 GB or compute exceeds 100 CU-hr/mo, upgrade to Neon Launch ($19/mo).
