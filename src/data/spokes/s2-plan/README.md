# S2: Plan — Benefits & Quote Intake

## Spoke Contract

| Field | Value |
|-------|-------|
| Spoke | S2 |
| Name | Plan |
| Purpose | Benefits & Quote Intake |
| Schema | clnt |
| CC Layer | CC-03 |

## Tables

| Table | Leaf Type | Write Rule | PK |
|-------|-----------|------------|----|
| plan | CANONICAL | Insert + Update | plan_id |
| plan_error | ERROR | Insert only (append) | plan_error_id |
| plan_quote | SUPPORT | Insert + Status update only | plan_quote_id |

## OSAM Routing

| Question | Route To |
|----------|----------|
| Benefit plan details | plan |
| Plan quotes / renewal pricing | plan_quote |
| Quote-to-plan lineage | plan (via source_quote_id) |
| Plan-level errors | plan_error |

## Write Rules

- **plan (CANONICAL)**: Full insert and update. Rates are embedded (self-contained).
- **plan_error (ERROR)**: Append-only. No updates, no deletes.
- **plan_quote (SUPPORT)**: Insert + status updates only. CHECK: received, presented, selected, rejected. Quote promotion copies rates into plan.

## CHECK Constraints

| Table | Column | Values |
|-------|--------|--------|
| plan_quote | status | received, presented, selected, rejected |

## Generated Files

- `types.ts` — TypeScript interfaces (GENERATED)
- `schema.ts` — Zod write schemas (GENERATED)
- `README.md` — This file (hand-authored)

## Source of Truth

All types and schemas are generated from `src/data/db/registry/clnt_column_registry.yml`.
Run `npx ts-node scripts/codegen-schema.ts` to regenerate.
