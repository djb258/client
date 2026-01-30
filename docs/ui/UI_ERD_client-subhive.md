# UI ERD — Client Intake & Vendor Export System

**Status**: ACTIVE
**Authority**: Derived from client_subhive_schema.sql
**Version**: 1.0.0

---

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 1.0.0 |
| **Owning Hub** | client-subhive |
| **Canonical Schema** | client_subhive_schema.sql |

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

## Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INGRESS (I)                                     │
│                         Raw Input Staging                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  clnt_i_raw_input          clnt_i_profile                                   │
│  └── Source staging        └── Source system profiles                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MIDDLE (M)                                      │
│                         Canonical Data                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  clnt_m_client ◄──┬── clnt_m_person ◄── clnt_m_election                    │
│       │           │        │                  │                             │
│       │           │        └──────────────────┼── clnt_m_plan               │
│       │           │                           │        │                    │
│       ├───────────┴── clnt_m_vendor_link      │        └── clnt_m_plan_cost │
│       │                                       │                             │
│       └── clnt_m_spd                          │                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EGRESS (O)                                      │
│                         Output/Export                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  clnt_o_output ◄── clnt_o_output_run          clnt_o_compliance             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Ingress (I) Layer — UI Read Access

### clnt_i_raw_input

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| raw_id | UUID | Hidden | No | System ID |
| client_uid | UUID | Hidden | No | Foreign key |
| source_system | TEXT | Display | No | Source identifier |
| source_version | TEXT | Display | No | Version info |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Admin views for debugging intake issues.

### clnt_i_profile

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| profile_id | UUID | Hidden | No | System ID |
| source_system | TEXT | Display | No | Source identifier |
| source_version | TEXT | Display | No | Version info |
| profile_name | TEXT | Display | No | Profile label |
| is_enabled | BOOLEAN | Display | No | Status indicator |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Source system configuration display.

---

## Middle (M) Layer — UI Read/Write Access

### clnt_m_client

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| client_uid | UUID | Hidden | No | Primary key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Client dashboard, client list.
**Note**: Additional business fields defined in migrations.

### clnt_m_person

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| person_uid | UUID | Hidden | No | Primary key |
| client_uid | UUID | Hidden | No | Foreign key |
| role | TEXT | Display | Via form | Employee/Dependent |
| employee_of_uid | UUID | Hidden | No | Self-reference FK |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Employee census, person detail views.
**Relationships**: Belongs to clnt_m_client.

### clnt_m_plan

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| plan_uid | UUID | Hidden | No | Primary key |
| client_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Plan selection, plan management.
**Relationships**: Belongs to clnt_m_client.

### clnt_m_plan_cost

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| plan_cost_id | UUID | Hidden | No | Primary key |
| plan_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Plan cost display (read-only in UI).
**Relationships**: Belongs to clnt_m_plan.

### clnt_m_election

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| election_id | UUID | Hidden | No | Primary key |
| person_uid | UUID | Hidden | No | Foreign key |
| plan_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Election confirmation, election review.
**Relationships**: Links clnt_m_person to clnt_m_plan.

### clnt_m_vendor_link

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| link_id | UUID | Hidden | No | Primary key |
| client_uid | UUID | Hidden | No | Foreign key |
| person_uid | UUID | Hidden | No | Foreign key |
| plan_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Vendor status display (read-only).
**Relationships**: Links client, person, and plan to vendor.

### clnt_m_spd

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| spd_id | UUID | Hidden | No | Primary key |
| client_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: SPD document display/download.
**Relationships**: Belongs to clnt_m_client.

---

## Egress (O) Layer — UI Read-Only Access

### clnt_o_output

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| output_id | UUID | Hidden | No | Primary key |
| client_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Export history list.
**Access**: READ-ONLY (no UI edits permitted).

### clnt_o_output_run

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| run_id | UUID | Hidden | No | Primary key |
| output_id | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Export run history, download links.
**Access**: READ-ONLY (no UI edits permitted).

### clnt_o_compliance

| Field | Type | UI Visibility | UI Editable | Notes |
|-------|------|---------------|-------------|-------|
| compliance_id | UUID | Hidden | No | Primary key |
| client_uid | UUID | Hidden | No | Foreign key |
| created_at | TIMESTAMPTZ | Display | No | Timestamp |
| updated_at | TIMESTAMPTZ | Display | No | Timestamp |

**UI Usage**: Compliance report display.
**Access**: READ-ONLY (no UI edits permitted).

---

## Relationship Summary

| Parent | Child | Cardinality | UI Navigation |
|--------|-------|-------------|---------------|
| clnt_m_client | clnt_m_person | 1:N | Client → Employees |
| clnt_m_client | clnt_m_plan | 1:N | Client → Plans |
| clnt_m_client | clnt_m_spd | 1:N | Client → Documents |
| clnt_m_client | clnt_m_vendor_link | 1:N | Client → Vendors |
| clnt_m_plan | clnt_m_plan_cost | 1:N | Plan → Costs |
| clnt_m_person | clnt_m_election | 1:N | Employee → Elections |
| clnt_m_plan | clnt_m_election | 1:N | Plan → Elections |
| clnt_m_client | clnt_o_output | 1:N | Client → Exports |
| clnt_o_output | clnt_o_output_run | 1:N | Export → Runs |
| clnt_m_client | clnt_o_compliance | 1:N | Client → Compliance |

---

## UI Annotations

### Display Formatting

| Field Type | UI Format |
|------------|-----------|
| UUID | Hidden (never display raw UUIDs) |
| TIMESTAMPTZ | Localized datetime |
| BOOLEAN | Toggle/Badge |
| TEXT | As-is or truncated |

### Permission Hints

| Layer | Default Permission |
|-------|-------------------|
| Ingress (I) | Admin read-only |
| Middle (M) | Read + form submission |
| Egress (O) | Read-only |

---

## Constraints for UI

1. **No joins in UI** — All joins handled by API
2. **No direct queries** — Use API endpoints only
3. **No field additions** — Schema is canonical
4. **No computed fields** — Display what API returns
5. **Respect layer boundaries** — Egress is always read-only

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Canonical Schema | client_subhive_schema.sql |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| UI PRD | docs/ui/UI_PRD_client-subhive.md |
| Canonical PRD | docs/prd/PRD.md |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-01-30 |
| Version | 1.0.0 |
| Status | ACTIVE |
| Authority | Derived from client_subhive_schema.sql |
| Sync Status | Mirrors canonical schema |
