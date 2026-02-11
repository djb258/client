# Client Infrastructure — Entity Relationship Diagram

**Schema**: `clnt`
**Tables**: 13
**ADR**: ADR-002-ctb-consolidated-backbone, ADR-004-renewal-downgraded-to-plan-support
**Version**: 2.2.0

---

## Complete Schema Map

```mermaid
erDiagram
    %% S1: HUB + CLIENT MASTER
    clnt_client_hub {
        UUID client_id PK
        TIMESTAMPTZ created_at
        TEXT status
        TEXT source
        INT version
    }

    clnt_client_master {
        UUID client_id PK_FK
        TEXT legal_name
        TEXT fein
        TEXT domicile_state
        DATE effective_date
    }

    %% S2: PLAN + PLAN QUOTE
    clnt_plan {
        UUID plan_id PK
        UUID client_id FK
        TEXT benefit_type
        TEXT carrier_id
        DATE effective_date
        TEXT status
        INT version
        NUMERIC rate_ee
        NUMERIC rate_es
        NUMERIC rate_ec
        NUMERIC rate_fam
        NUMERIC employer_rate_ee
        NUMERIC employer_rate_es
        NUMERIC employer_rate_ec
        NUMERIC employer_rate_fam
        UUID source_quote_id FK
    }

    clnt_plan_quote {
        UUID plan_quote_id PK
        UUID client_id FK
        TEXT benefit_type
        TEXT carrier_id
        INT effective_year
        NUMERIC rate_ee
        NUMERIC rate_es
        NUMERIC rate_ec
        NUMERIC rate_fam
        TEXT source
        DATE received_date
        TEXT status
        TIMESTAMPTZ created_at
    }

    %% S3: ENROLLMENT INTAKE
    clnt_intake_batch {
        UUID intake_batch_id PK
        UUID client_id FK
        TIMESTAMPTZ upload_date
        TEXT status
    }

    clnt_intake_record {
        UUID intake_record_id PK
        UUID client_id FK
        UUID intake_batch_id FK
        JSONB raw_payload
    }

    %% S4: ENROLLMENT VAULT
    clnt_person {
        UUID person_id PK
        UUID client_id FK
        TEXT first_name
        TEXT last_name
        TEXT ssn_hash
        TEXT status
    }

    clnt_election {
        UUID election_id PK
        UUID client_id FK
        UUID person_id FK
        UUID plan_id FK
        TEXT coverage_tier
        DATE effective_date
    }

    %% S5: VENDOR + IDENTITY MAP
    clnt_vendor {
        UUID vendor_id PK
        UUID client_id FK
        TEXT vendor_name
        TEXT vendor_type
    }

    clnt_external_identity_map {
        UUID external_identity_id PK
        UUID client_id FK
        TEXT entity_type
        UUID internal_id
        UUID vendor_id FK
        TEXT external_id_value
        DATE effective_date
        TEXT status
    }

    %% S6: SERVICE
    clnt_service_request {
        UUID service_request_id PK
        UUID client_id FK
        TEXT category
        TEXT status
        TIMESTAMPTZ opened_at
    }

    %% S7: COMPLIANCE
    clnt_compliance_flag {
        UUID compliance_flag_id PK
        UUID client_id FK
        TEXT flag_type
        TEXT status
        DATE effective_date
    }

    %% S8: AUDIT
    clnt_audit_event {
        UUID audit_event_id PK
        UUID client_id FK
        TEXT entity_type
        UUID entity_id
        TEXT action
        TIMESTAMPTZ created_at
    }

    %% RELATIONSHIPS
    clnt_client_hub ||--|| clnt_client_master : "identity"
    clnt_client_hub ||--o{ clnt_plan : "has plans"
    clnt_client_hub ||--o{ clnt_plan_quote : "receives quotes"
    clnt_plan_quote ||--o{ clnt_plan : "promoted to"
    clnt_client_hub ||--o{ clnt_intake_batch : "receives"
    clnt_intake_batch ||--o{ clnt_intake_record : "contains"
    clnt_client_hub ||--o{ clnt_person : "enrolls"
    clnt_person ||--o{ clnt_election : "elects"
    clnt_plan ||--o{ clnt_election : "covers"
    clnt_client_hub ||--o{ clnt_vendor : "contracts"
    clnt_vendor ||--o{ clnt_external_identity_map : "maps IDs"
    clnt_client_hub ||--o{ clnt_service_request : "requests"
    clnt_client_hub ||--o{ clnt_compliance_flag : "flagged"
    clnt_client_hub ||--o{ clnt_audit_event : "audited"
```

---

## Spoke Architecture

```mermaid
graph LR
    HUB["S1: client_hub<br/>client_master"]

    HUB --> S2["S2: plan<br/>plan_quote"]
    HUB --> S3["S3: intake_batch<br/>intake_record"]
    HUB --> S4["S4: person<br/>election"]
    HUB --> S5["S5: vendor<br/>external_identity_map"]
    HUB --> S6["S6: service_request"]
    HUB --> S7["S7: compliance_flag"]
    HUB --> S8["S8: audit_event"]

    S4 --> S2
    S5 -.-> S4

    classDef hub fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    classDef spoke fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef staging fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef audit fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class HUB hub
    class S2,S4,S5,S6,S7 spoke
    class S3 staging
    class S8 audit
```

---

## Promotion Flow (Quote → Plan)

```mermaid
flowchart LR
    Q1["plan_quote<br/>(received)"] --> Q2["plan_quote<br/>(presented)"]
    Q2 --> Q3["plan_quote<br/>(selected)"]
    Q2 --> Q4["plan_quote<br/>(rejected)"]
    Q3 -->|"copy rates"| P["plan<br/>(source_quote_id = plan_quote_id)"]
```

---

## Data Flow

```mermaid
flowchart TB
    INPUT["API / CSV / UI"]

    INPUT --> S3_BATCH["clnt.intake_batch"]
    S3_BATCH --> S3_REC["clnt.intake_record"]

    S3_REC -->|"validate + promote"| S4_P["clnt.person"]
    S3_REC -->|"validate + promote"| S2["clnt.plan"]

    INPUT -->|"quote intake"| S2_Q["clnt.plan_quote"]
    S2_Q -->|"promote selected"| S2

    S4_P --> S4_E["clnt.election"]
    S2 --> S4_E

    S4_P --> S5_EIM["clnt.external_identity_map"]
    S2 --> S5_EIM
    S5_V["clnt.vendor"] --> S5_EIM

    S4_P --> S8["clnt.audit_event"]
    S2 --> S8
    S4_E --> S8
    S3_BATCH --> S8

    classDef staging fill:#fce4ec,stroke:#880e4f
    classDef vault fill:#e1f5ff,stroke:#01579b
    classDef vendor fill:#f3e5f5,stroke:#4a148c
    classDef audit fill:#e8f5e9,stroke:#1b5e20
    classDef support fill:#fff3e0,stroke:#e65100

    class S3_BATCH,S3_REC staging
    class S4_P,S4_E,S2 vault
    class S5_V,S5_EIM vendor
    class S8 audit
    class S2_Q support
```

---

## Key Constraints

| Constraint | Table | Rule |
|-----------|-------|------|
| `coverage_tier` CHECK | `election` | Must be `EE`, `ES`, `EC`, or `FAM` |
| `entity_type` CHECK | `external_identity_map` | Must be `person` or `plan` |
| `status` CHECK | `plan_quote` | Must be `received`, `presented`, `selected`, or `rejected` |
| `source_quote_id` FK | `plan` | Nullable FK to `plan_quote.plan_quote_id` (promotion lineage) |
| All PKs | All tables | UUID via `gen_random_uuid()` |
| All FKs | All tables | Point to `client_hub.client_id` or parent spoke |

---

**Diagram Version**: 2.2.0
**Created**: 2026-02-11
**Schema**: `clnt`
**Views**: None
