# S3: Employee — Enrollment & Employee Identity

## Spoke Contract

| Field | Value |
|-------|-------|
| Spoke | S3 |
| Name | Employee |
| Purpose | Enrollment & Employee Identity |
| Schema | clnt |
| CC Layer | CC-03 |

## Tables

| Table | Leaf Type | Write Rule | PK |
|-------|-----------|------------|----|
| person | CANONICAL | Insert + Update | person_id |
| employee_error | ERROR | Insert only (append) | employee_error_id |
| election | SUPPORT | Insert + Limited update (coverage_tier, effective_date) | election_id |
| enrollment_intake | STAGING | Insert + Status update only | enrollment_intake_id |
| intake_record | STAGING | Insert only (immutable) | intake_record_id |

## Data Flow

```
enrollment_intake (STAGING) → validation → person (CANONICAL)
         ↓ failures
   employee_error (ERROR)
```

Raw enrollment data arrives in `enrollment_intake` batches containing `intake_record` rows. After validation, clean records promote to `person`. Failures log to `employee_error`.

## OSAM Routing

| Question | Route To |
|----------|----------|
| Employee/dependent info | person |
| Benefit elections | election |
| Enrollment batch status | enrollment_intake |
| Enrollment validation errors | employee_error |

## Write Rules

- **person (CANONICAL)**: Full insert and update. Promoted from enrollment_intake.
- **employee_error (ERROR)**: Append-only. No updates, no deletes.
- **election (SUPPORT)**: Insert + update coverage_tier and effective_date only.
- **enrollment_intake (STAGING)**: Insert + status update only.
- **intake_record (STAGING)**: Insert only. Immutable after creation.

## CHECK Constraints

| Table | Column | Values |
|-------|--------|--------|
| election | coverage_tier | EE, ES, EC, FAM |

## Generated Files

- `types.ts` — TypeScript interfaces (GENERATED)
- `schema.ts` — Zod write schemas (GENERATED)
- `README.md` — This file (hand-authored)

## Source of Truth

All types and schemas are generated from `src/data/db/registry/clnt_column_registry.yml`.
Run `npx ts-node scripts/codegen-schema.ts` to regenerate.
