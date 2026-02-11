# UI ERD — Client Intake & Vendor Export System

**Status**: ACTIVE
**Authority**: Derived from db/neon/migrations/SCHEMA_ER_DIAGRAM.md
**Version**: 2.0.0

---

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.0.0 |
| **Owning Hub** | client-subhive |
| **Canonical Schema** | clnt (Neon PostgreSQL) |
| **Canonical ERD** | db/neon/migrations/SCHEMA_ER_DIAGRAM.md v2.2.0 |

---

## Purpose

This document provides a **read-only mirror** of the canonical database schema for UI development purposes.

**This ERD does NOT define schema. It mirrors it.**

UI implementations use this document to understand:
- What data is available
- How entities relate
- What fields can be displayed
- What is read-only vs editable

---

## Schema Overview (CTB Spoke Structure)

```
                         ┌─────────────────────────────────┐
                         │   S1: HUB (Spine)               │
                         │   client_hub  client_master      │
                         └──────────────┬──────────────────┘
                                        │ client_id (Universal Join Key)
           ┌────────────┬───────────────┼──────────────┬───────────┐
           │            │               │              │           │
    ┌──────┴──────┐ ┌───┴────┐  ┌───────┴───────┐ ┌───┴───┐ ┌────┴────┐
    │  S2: Plan   │ │S3:Intk │  │  S4: Vault    │ │S5:Vnd │ │S6:Svc   │
    │  plan       │ │batch   │  │  person       │ │vendor │ │svc_req  │
    │  plan_quote │ │record  │  │  election     │ │ext_id │ │         │
    └─────────────┘ └────────┘  └───────────────┘ └───────┘ └─────────┘
           │                            │
    ┌──────┴──────┐               ┌─────┴─────┐
    │S7:Compliance│               │ S8: Audit │
    │  comp_flag  │               │ audit_evt │
    └─────────────┘               └───────────┘
```

---

## S1: Hub (Spine) — UI Read Access

### client_hub (FROZEN — Read-Only After Creation)

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| client_id | UUID | Hidden | No | Universal join key (PK) |
| created_at | TIMESTAMPTZ | Display | No | Record creation timestamp |
| status | TEXT | Display | No | Lifecycle state (pending/active/suspended/terminated) |
| source | TEXT | Display | No | Origin system identifier |
| version | INT | Hidden | No | Record version counter |

**UI Usage**: Client dashboard header, status badges.
**Access**: READ-ONLY (FROZEN table — never editable).

### client_master

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| client_id | UUID | Hidden | No | PK + FK to client_hub |
| legal_name | TEXT | Display | Via form | Legal company name |
| fein | TEXT | Display (masked) | Via form | Federal EIN (sensitive) |
| domicile_state | TEXT | Display | Via form | State of incorporation |
| effective_date | DATE | Display | Via form | Client effective date |

**UI Usage**: Client detail view, client setup form.
**Relationships**: 1:1 with client_hub.

---

## S2: Plan — UI Read/Write Access

### plan

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| plan_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| benefit_type | TEXT | Display | Via form | Medical, dental, vision, etc. |
| carrier_id | TEXT | Display | Via form | Insurance carrier reference |
| effective_date | DATE | Display | Via form | Plan effective date |
| status | TEXT | Display | No | Plan lifecycle state |
| version | INT | Hidden | No | Record version counter |
| rate_ee | NUMERIC | Display | No | Employee-only rate |
| rate_es | NUMERIC | Display | No | Employee + spouse rate |
| rate_ec | NUMERIC | Display | No | Employee + child rate |
| rate_fam | NUMERIC | Display | No | Family rate |
| employer_rate_ee | NUMERIC | Display | No | Employer contribution (EE) |
| employer_rate_es | NUMERIC | Display | No | Employer contribution (ES) |
| employer_rate_ec | NUMERIC | Display | No | Employer contribution (EC) |
| employer_rate_fam | NUMERIC | Display | No | Employer contribution (FAM) |
| source_quote_id | UUID | Hidden | No | FK to plan_quote (nullable, promotion lineage) |

**UI Usage**: Plan management, plan selection during enrollment, rate comparison.
**Relationships**: Belongs to client_hub. Rates are embedded (no separate cost table).

### plan_quote (SUPPORT — Limited Query Surface)

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| plan_quote_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| benefit_type | TEXT | Display | Via form | Benefit category |
| carrier_id | TEXT | Display | Via form | Carrier reference |
| effective_year | INT | Display | Via form | Quote effective year |
| rate_ee | NUMERIC | Display | Via form | Quoted employee-only rate |
| rate_es | NUMERIC | Display | Via form | Quoted employee + spouse rate |
| rate_ec | NUMERIC | Display | Via form | Quoted employee + child rate |
| rate_fam | NUMERIC | Display | Via form | Quoted family rate |
| source | TEXT | Display | Via form | Quote source (carrier, broker) |
| received_date | DATE | Display | No | When quote was received |
| status | TEXT | Display | No | received/presented/selected/rejected |
| created_at | TIMESTAMPTZ | Display | No | Record timestamp |

**UI Usage**: Quote intake, quote comparison, quote status tracking.
**Relationships**: Belongs to client_hub. Can promote to plan via rate copy.

---

## S3: Intake (STAGING — No Direct UI Query)

### intake_batch

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| intake_batch_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| upload_date | TIMESTAMPTZ | Display | No | Batch upload timestamp |
| status | TEXT | Display | No | Batch processing status |

**UI Usage**: Admin-only batch status monitoring. NOT a business query surface.
**Access**: READ-ONLY, admin-only views.

### intake_record

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| intake_record_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| intake_batch_id | UUID | Hidden | No | FK to intake_batch |
| raw_payload | JSONB | Hidden | No | Raw intake data |

**UI Usage**: Admin-only debugging. STAGING data is never displayed to business users.
**Access**: READ-ONLY, admin-only views.

---

## S4: Vault — UI Read/Write Access

### person

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| person_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| first_name | TEXT | Display | Via form | Employee first name |
| last_name | TEXT | Display | Via form | Employee last name |
| ssn_hash | TEXT | Hidden | No | Hashed SSN (never display) |
| status | TEXT | Display | No | Person lifecycle status |

**UI Usage**: Employee census, person detail views, employee roster.
**Relationships**: Belongs to client_hub.

### election

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| election_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| person_id | UUID | Hidden | No | FK to person |
| plan_id | UUID | Hidden | No | FK to plan |
| coverage_tier | TEXT | Display | Via form | EE, ES, EC, or FAM |
| effective_date | DATE | Display | Via form | Election effective date |

**UI Usage**: Election confirmation, election review, benefits summary.
**Relationships**: Bridge between person and plan.

---

## S5: Vendor — UI Read-Only Access

### vendor

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| vendor_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| vendor_name | TEXT | Display | No | Vendor display name |
| vendor_type | TEXT | Display | No | Vendor category |

**UI Usage**: Vendor status display, vendor list.
**Access**: READ-ONLY (vendor management is admin-only).

### external_identity_map

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| external_identity_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| entity_type | TEXT | Display | No | person or plan |
| internal_id | UUID | Hidden | No | Reference to internal entity |
| vendor_id | UUID | Hidden | No | FK to vendor |
| external_id_value | TEXT | Display | No | Vendor-assigned external ID |
| effective_date | DATE | Display | No | Mapping effective date |
| status | TEXT | Display | No | Mapping status |

**UI Usage**: Admin-only ID mapping display. External IDs must never replace internal UUIDs.
**Access**: READ-ONLY.

---

## S6: Service — UI Read/Write Access

### service_request

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| service_request_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| category | TEXT | Display | Via form | Service request category |
| status | TEXT | Display | No | Request lifecycle status |
| opened_at | TIMESTAMPTZ | Display | No | When request was opened |

**UI Usage**: Service ticket list, ticket detail, new ticket form.
**Relationships**: Belongs to client_hub.

---

## S7: Compliance — UI Read-Only Access

### compliance_flag

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| compliance_flag_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| flag_type | TEXT | Display | No | Compliance flag category |
| status | TEXT | Display | No | Flag status |
| effective_date | DATE | Display | No | Flag effective date |

**UI Usage**: Compliance report display, compliance dashboard.
**Access**: READ-ONLY (compliance flags are system-generated).

---

## S8: Audit — NO UI Business Access

### audit_event

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| audit_event_id | UUID | Hidden | No | Primary key |
| client_id | UUID | Hidden | No | FK to client_hub |
| entity_type | TEXT | Hidden | No | Audited entity type |
| entity_id | UUID | Hidden | No | Audited entity reference |
| action | TEXT | Hidden | No | Action performed |
| created_at | TIMESTAMPTZ | Hidden | No | Event timestamp |

**UI Usage**: NONE for business users. Admin-only audit log viewer if required.
**Access**: AUDIT table — NOT a business query surface per OSAM.

---

## Relationship Summary

| Parent | Child | Cardinality | UI Navigation |
|--------|-------|-------------|---------------|
| client_hub | client_master | 1:1 | Client → Details |
| client_hub | plan | 1:N | Client → Plans |
| client_hub | plan_quote | 1:N | Client → Quotes |
| plan_quote | plan | N:1 | Quote → Promoted Plan (via source_quote_id) |
| client_hub | intake_batch | 1:N | (Admin only) |
| intake_batch | intake_record | 1:N | (Admin only) |
| client_hub | person | 1:N | Client → Employees |
| person | election | 1:N | Employee → Elections |
| plan | election | 1:N | Plan → Elections |
| client_hub | vendor | 1:N | Client → Vendors |
| vendor | external_identity_map | 1:N | Vendor → ID Mappings |
| client_hub | service_request | 1:N | Client → Service Tickets |
| client_hub | compliance_flag | 1:N | Client → Compliance |
| client_hub | audit_event | 1:N | (System only) |

---

## UI Annotations

### Display Formatting

| Field Type | UI Format |
|------------|-----------|
| UUID | Hidden (never display raw UUIDs) |
| TIMESTAMPTZ | Localized datetime |
| DATE | Localized date |
| NUMERIC (rates) | Currency format ($X.XX) |
| TEXT (status) | Badge/Chip component |
| TEXT (ssn_hash) | Never display |
| BOOLEAN | Toggle/Badge |
| JSONB | Hidden (raw data) |

### Permission Hints by Spoke

| Spoke | Default Permission | Notes |
|-------|-------------------|-------|
| S1: Hub | Read-only (FROZEN) + form for client_master | client_hub is never editable |
| S2: Plan | Read + form for quotes | Plans created via promotion only |
| S3: Intake | Admin read-only | STAGING — not business query surface |
| S4: Vault | Read + form submission | Employee and election management |
| S5: Vendor | Read-only | Vendor management is admin-only |
| S6: Service | Read + form submission | Service ticket creation |
| S7: Compliance | Read-only | System-generated flags |
| S8: Audit | No business access | System log only |

---

## Constraints for UI

1. **No joins in UI** — All joins handled by API via OSAM-declared paths
2. **No direct queries** — Use API endpoints only
3. **No field additions** — Schema is canonical (governed by ERD)
4. **No computed fields** — Display what API returns
5. **Respect spoke boundaries** — Staging (S3) and Audit (S8) are not business surfaces
6. **Universal join key** — All data routes through `client_id`; UI never needs to know this

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Canonical ERD | db/neon/migrations/SCHEMA_ER_DIAGRAM.md v2.2.0 |
| OSAM | doctrine/OSAM.md v2.0.0 |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| UI PRD | docs/ui/UI_PRD_client-subhive.md |
| Canonical PRD | docs/prd/PRD.md v2.0.0 |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-02-11 |
| Version | 2.0.0 |
| Status | ACTIVE |
| Authority | Derived from db/neon/migrations/SCHEMA_ER_DIAGRAM.md |
| Sync Status | Mirrors canonical ERD v2.2.0 |
