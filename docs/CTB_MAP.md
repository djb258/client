# CTB Map — Client Infrastructure Backbone

**Schema**: `clnt`
**ADR**: ADR-002, ADR-004
**Tables**: 13
**Date**: 2026-02-11

---

## Spoke Registry

| Spoke | ID | Tables | Purpose |
|-------|----|--------|---------|
| Hub | S1 | `client_hub`, `client_master` | Root identity + legal details |
| Plan | S2 | `plan`, `plan_quote` | Benefit plans + quote intake |
| Intake | S3 | `intake_batch`, `intake_record` | Enrollment staging (one-way) |
| Vault | S4 | `person`, `election` | Employee identity + benefit elections |
| Vendor | S5 | `vendor`, `external_identity_map` | Vendor identity + ID translation |
| Service | S6 | `service_request` | Service ticket tracking |
| Compliance | S7 | `compliance_flag` | Compliance flag tracking |
| Audit | S8 | `audit_event` | Append-only system audit trail |

---

## Table Detail

### S1: Hub + Client Master

```
client_hub (READ-ONLY after creation)
├── client_id       UUID PK
├── created_at      TIMESTAMPTZ
├── status          TEXT
├── source          TEXT
└── version         INT

client_master
├── client_id       UUID PK (FK → client_hub)
├── legal_name      TEXT NOT NULL
├── fein            TEXT
├── domicile_state  TEXT
└── effective_date  DATE
```

### S2: Plan + Quote

```
plan (canonical — single source of truth for active rates)
├── plan_id           UUID PK
├── client_id         UUID FK → client_hub
├── benefit_type      TEXT NOT NULL
├── carrier_id        TEXT
├── effective_date    DATE
├── status            TEXT
├── version           INT
├── rate_ee           NUMERIC(10,2)
├── rate_es           NUMERIC(10,2)
├── rate_ec           NUMERIC(10,2)
├── rate_fam          NUMERIC(10,2)
├── employer_rate_ee  NUMERIC(10,2)
├── employer_rate_es  NUMERIC(10,2)
├── employer_rate_ec  NUMERIC(10,2)
├── employer_rate_fam NUMERIC(10,2)
└── source_quote_id   UUID FK → plan_quote (nullable, promotion lineage)

plan_quote (support — multiple quotes per benefit/year allowed)
├── plan_quote_id   UUID PK
├── client_id       UUID FK → client_hub
├── benefit_type    TEXT NOT NULL
├── carrier_id      TEXT NOT NULL
├── effective_year  INT NOT NULL
├── rate_ee         NUMERIC(10,2)
├── rate_es         NUMERIC(10,2)
├── rate_ec         NUMERIC(10,2)
├── rate_fam        NUMERIC(10,2)
├── source          TEXT
├── received_date   DATE
└── status          TEXT CHECK (received | presented | selected | rejected)
```

**Promotion flow**: When a quote is selected, its rates are copied into a new `plan` row with `source_quote_id` pointing back to the quote. One selected quote per benefit per cycle — enforced operationally, not by constraint.

### S3: Enrollment Intake (Staging)

```
intake_batch
├── intake_batch_id UUID PK
├── client_id       UUID FK → client_hub
├── upload_date     TIMESTAMPTZ
└── status          TEXT

intake_record
├── intake_record_id UUID PK
├── client_id        UUID FK → client_hub
├── intake_batch_id  UUID FK → intake_batch
└── raw_payload      JSONB NOT NULL
```

### S4: Enrollment Vault

```
person
├── person_id       UUID PK
├── client_id       UUID FK → client_hub
├── first_name      TEXT NOT NULL
├── last_name       TEXT NOT NULL
├── ssn_hash        TEXT
└── status          TEXT

election (bridge — do NOT merge with person)
├── election_id     UUID PK
├── client_id       UUID FK → client_hub
├── person_id       UUID FK → person
├── plan_id         UUID FK → plan
├── coverage_tier   TEXT CHECK (EE | ES | EC | FAM)
└── effective_date  DATE NOT NULL
```

### S5: Vendor + Identity Map

```
vendor
├── vendor_id       UUID PK
├── client_id       UUID FK → client_hub
├── vendor_name     TEXT NOT NULL
└── vendor_type     TEXT

external_identity_map
├── external_identity_id UUID PK
├── client_id            UUID FK → client_hub
├── entity_type          TEXT CHECK (person | plan)
├── internal_id          UUID NOT NULL
├── vendor_id            UUID FK → vendor
├── external_id_value    TEXT NOT NULL
├── effective_date       DATE
└── status               TEXT
```

### S6: Service

```
service_request
├── service_request_id UUID PK
├── client_id          UUID FK → client_hub
├── category           TEXT NOT NULL
├── status             TEXT
└── opened_at          TIMESTAMPTZ
```

### S7: Compliance

```
compliance_flag
├── compliance_flag_id UUID PK
├── client_id          UUID FK → client_hub
├── flag_type          TEXT NOT NULL
├── status             TEXT
└── effective_date     DATE
```

### S8: Audit

```
audit_event (APPEND-ONLY — no updates, no deletes)
├── audit_event_id  UUID PK
├── client_id       UUID FK → client_hub
├── entity_type     TEXT NOT NULL
├── entity_id       UUID NOT NULL
├── action          TEXT NOT NULL
└── created_at      TIMESTAMPTZ
```

---

## Leaf Classification

| Table | Leaf Type | Write Rule |
|-------|-----------|------------|
| `client_hub` | FROZEN | Insert once, read-only after |
| `client_master` | CANONICAL | Normal writes |
| `plan` | CANONICAL | Normal writes |
| `plan_quote` | SUPPORT | Append-mostly, status updates only |
| `intake_batch` | STAGING | Temporary, batch-scoped |
| `intake_record` | STAGING | Temporary, immutable after insert |
| `person` | CANONICAL | Normal writes |
| `election` | CANONICAL | Normal writes |
| `vendor` | CANONICAL | Normal writes |
| `external_identity_map` | CANONICAL | Normal writes |
| `service_request` | CANONICAL | Normal writes |
| `compliance_flag` | CANONICAL | Normal writes |
| `audit_event` | AUDIT | Append-only, system write only |

---

## Join Contracts

All joins MUST include `client_id`. No lateral joins without it.

| Join | Path | Cardinality |
|------|------|-------------|
| Hub → Master | `client_hub.client_id = client_master.client_id` | 1:1 |
| Hub → Plan | `client_hub.client_id = plan.client_id` | 1:N |
| Plan → Quote (lineage) | `plan.source_quote_id = plan_quote.plan_quote_id` | N:1 |
| Hub → Plan Quote | `client_hub.client_id = plan_quote.client_id` | 1:N |
| Hub → Person | `client_hub.client_id = person.client_id` | 1:N |
| Person → Election | `person.person_id = election.person_id` | 1:N |
| Plan → Election | `plan.plan_id = election.plan_id` | 1:N |
| Hub → Vendor | `client_hub.client_id = vendor.client_id` | 1:N |
| Vendor → ExtID | `vendor.vendor_id = external_identity_map.vendor_id` | 1:N |
| Hub → Intake Batch | `client_hub.client_id = intake_batch.client_id` | 1:N |
| Batch → Record | `intake_batch.intake_batch_id = intake_record.intake_batch_id` | 1:N |

---

## Enforcement Rules

1. All writes occur at leaf tables only
2. Hub exposes read-only views
3. No lateral spoke joins without `client_id`
4. Intake → Vault is one-way (staging data is never read back into intake)
5. External identity mapping must never replace internal IDs
6. `audit_event` is append-only — no UPDATE or DELETE
7. Quote promotion copies rates into `plan` — plan is always self-contained

---

## FK Summary

| FK Count | Direction |
|----------|-----------|
| 14 enforced FKs | All point to `client_hub.client_id` or parent spoke table |
| 0 circular refs | Clean DAG |

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 2.0.0 |
| Created | 2026-02-11 |
| Last Modified | 2026-02-11 |
| ADR | ADR-002, ADR-004 |
| Status | ACTIVE |
