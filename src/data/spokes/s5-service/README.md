# S5: Service — Ticket Tracking & Dashboards

## Spoke Contract

| Field | Value |
|-------|-------|
| Spoke | S5 |
| Name | Service |
| Purpose | Service Ticket Tracking & Dashboards |
| Schema | clnt |
| CC Layer | CC-03 |

## Tables

| Table | Leaf Type | Write Rule | PK |
|-------|-----------|------------|----|
| service_request | CANONICAL | Insert + Update | service_request_id |
| service_error | ERROR | Insert only (append) | service_error_id |

## OSAM Routing

| Question | Route To |
|----------|----------|
| Service tickets | service_request |
| Service processing errors | service_error |

## Write Rules

- **service_request (CANONICAL)**: Full insert and update. Will grow to support dashboard features.
- **service_error (ERROR)**: Append-only. No updates, no deletes.

## Generated Files

- `types.ts` — TypeScript interfaces (GENERATED)
- `schema.ts` — Zod write schemas (GENERATED)
- `README.md` — This file (hand-authored)

## Source of Truth

All types and schemas are generated from `src/data/db/registry/clnt_column_registry.yml`.
Run `npx ts-node scripts/codegen-schema.ts` to regenerate.
