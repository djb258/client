# S1: Hub — Client Identity & Configuration

## Spoke Contract

| Field | Value |
|-------|-------|
| Spoke | S1 |
| Name | Hub |
| Purpose | Client Identity & Configuration |
| Schema | clnt |
| CC Layer | CC-03 |

## Tables

| Table | Leaf Type | Write Rule | PK |
|-------|-----------|------------|----|
| client | CANONICAL | Insert + Update | client_id |
| client_error | ERROR | Insert only (append) | client_error_id |

## Ownership

- `client` is the **spine table** — sovereign identity for all spokes
- `client_id` is the universal join key for the entire hub
- All other spoke tables FK to `client.client_id`
- Merges former `client_hub` + `client_master` + `client_projection` into one record

## OSAM Routing

| Question | Route To |
|----------|----------|
| Client identity | client |
| Client legal/business details | client |
| Client UI projection | client |
| Client-level errors | client_error |

## Write Rules

- **client (CANONICAL)**: Full insert and update. `client_id` is immutable after creation.
- **client_error (ERROR)**: Append-only. No updates, no deletes.

## Generated Files

- `types.ts` — TypeScript interfaces (GENERATED — do not hand-edit)
- `schema.ts` — Zod write schemas (GENERATED — do not hand-edit)
- `README.md` — This file (hand-authored governance contract)

## Source of Truth

All types and schemas are generated from `src/data/db/registry/clnt_column_registry.yml`.
Run `npx ts-node scripts/codegen-schema.ts` to regenerate.
