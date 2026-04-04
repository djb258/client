# S4: Vendor — Vendor Identity & Billing

## Spoke Contract

| Field | Value |
|-------|-------|
| Spoke | S4 |
| Name | Vendor |
| Purpose | Vendor Identity & Billing |
| Schema | clnt |
| CC Layer | CC-03 |

## Tables

| Table | Leaf Type | Write Rule | PK |
|-------|-----------|------------|----|
| vendor | CANONICAL | Insert + Update | vendor_id |
| vendor_error | ERROR | Insert only (append) | vendor_error_id |
| external_identity_map | SUPPORT | Insert + Limited update (status, effective_date) | external_identity_id |
| invoice | SUPPORT | Insert + Limited update (status, due_date) | invoice_id |

## OSAM Routing

| Question | Route To |
|----------|----------|
| Vendor identity | vendor |
| External ID translation | external_identity_map |
| Vendor invoices / billing | invoice |
| Vendor-level errors | vendor_error |

## Write Rules

- **vendor (CANONICAL)**: Full insert and update.
- **vendor_error (ERROR)**: Append-only. No updates, no deletes.
- **external_identity_map (SUPPORT)**: Insert + update status and effective_date only. External IDs never replace internal UUIDs.
- **invoice (SUPPORT)**: Insert + update status and due_date only. CHECK: received, approved, paid, disputed.

## CHECK Constraints

| Table | Column | Values |
|-------|--------|--------|
| external_identity_map | entity_type | person, plan |
| invoice | status | received, approved, paid, disputed |

## Generated Files

- `types.ts` — TypeScript interfaces (GENERATED)
- `schema.ts` — Zod write schemas (GENERATED)
- `README.md` — This file (hand-authored)

## Source of Truth

All types and schemas are generated from `src/data/db/registry/clnt_column_registry.yml`.
Run `npx ts-node scripts/codegen-schema.ts` to regenerate.
