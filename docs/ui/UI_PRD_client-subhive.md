# UI PRD — Client Intake & Vendor Export System

**Status**: ACTIVE
**Authority**: Derived from docs/prd/PRD.md
**Version**: 1.0.0

---

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 1.0.0 |
| **Owning Hub** | client-subhive |
| **Canonical PRD** | docs/prd/PRD.md |

---

## UI Identity

| Field | Value |
|-------|-------|
| **UI Name** | Client Intake Portal |
| **Owning Hub** | client-subhive |
| **Type** | Web Application |
| **Location** | ctb/ui/ |

---

## Explicit Exclusions

This UI does NOT:

- Own any database tables
- Execute business logic
- Define validation rules (beyond format)
- Orchestrate workflows
- Manage vendor integrations
- Handle compliance calculations
- Store persistent data (except auth tokens)

---

## Screens/Views

### 1. Client Intake Views (Ingress UI)

| View | Purpose | Data Source | Events Emitted |
|------|---------|-------------|----------------|
| Company Setup | Collect company information | User input | `company.create`, `company.update` |
| Employee Census | Collect employee data | User input | `employee.create`, `employee.import` |
| Plan Selection | Display available plans | `clnt_m_plan` (read) | `election.select` |
| Election Confirmation | Confirm benefit elections | User input | `election.confirm` |

### 2. Management Views (Middle UI - Read/Write)

| View | Purpose | Data Source | Events Emitted |
|------|---------|-------------|----------------|
| Client Dashboard | Display client overview | `clnt_m_client` (read) | Navigation events |
| Employee List | Display employee roster | `clnt_m_person` (read) | `employee.view`, `employee.edit` |
| Plan Management | Display plan configurations | `clnt_m_plan` (read) | `plan.view` |
| Election Review | Display current elections | `clnt_m_election` (read) | `election.modify` |

### 3. Export Views (Egress UI - Read Only)

| View | Purpose | Data Source | Events Emitted |
|------|---------|-------------|----------------|
| Export History | Display export runs | `clnt_o_output_run` (read) | `export.download` |
| Compliance Reports | Display compliance status | `clnt_o_compliance` (read) | `report.download` |
| Vendor Status | Display vendor sync status | `clnt_o_output` (read) | None (read-only) |

---

## Canonical Outputs Consumed (Read-Only)

| API Endpoint | Canonical Table | UI Usage |
|--------------|-----------------|----------|
| GET /api/clients | clnt_m_client | Client list, dashboard |
| GET /api/clients/:id | clnt_m_client | Client detail |
| GET /api/persons | clnt_m_person | Employee list |
| GET /api/plans | clnt_m_plan | Plan selection |
| GET /api/elections | clnt_m_election | Election review |
| GET /api/exports | clnt_o_output | Export history |
| GET /api/compliance | clnt_o_compliance | Compliance reports |

---

## Events Emitted (Intents)

| Event | Trigger | Payload | Handler |
|-------|---------|---------|---------|
| `company.create` | Form submit | Company data | API → Middle layer |
| `company.update` | Form submit | Updated fields | API → Middle layer |
| `employee.create` | Form submit | Employee data | API → Middle layer |
| `employee.import` | File upload | CSV/Excel data | API → Middle layer |
| `election.select` | Plan selection | Plan + person IDs | API → Middle layer |
| `election.confirm` | Confirmation | Election bundle | API → Middle layer |
| `export.trigger` | Button click | Export config | API → Middle layer |
| `report.download` | Button click | Report ID | API → Egress layer |

---

## Failure States (Display Only)

| Failure | UI Response | User Action |
|---------|-------------|-------------|
| API unavailable | Error banner + retry button | Retry or contact support |
| Validation error | Field-level error messages | Correct input |
| Session expired | Redirect to login | Re-authenticate |
| Permission denied | Access denied message | Contact admin |
| Export failed | Error notification | View details, retry |

---

## Surface Classification

### Read-Only Surfaces

- Client Dashboard
- Employee List (view mode)
- Plan Details
- Export History
- Compliance Reports
- Vendor Status

### Event-Emitting Surfaces

- Company Setup Form
- Employee Census Form
- Plan Selection
- Election Confirmation
- Export Trigger
- Employee Edit Form

---

## Explicit Forbidden Behaviors

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     FORBIDDEN IN THIS UI                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ❌ Direct database queries                                                 ║
║   ❌ Business rule calculations (premium, compliance, etc.)                  ║
║   ❌ Workflow state management                                               ║
║   ❌ Cross-client data access                                                ║
║   ❌ Vendor API calls (handled by agents)                                    ║
║   ❌ Compliance determination                                                ║
║   ❌ Data transformation beyond display formatting                           ║
║   ❌ Caching canonical data (always fetch fresh)                             ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Component Structure (Recommended)

```
ctb/ui/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx           # Client list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Client detail
│   │   ├── intake/
│   │   │   ├── company/
│   │   │   ├── employees/
│   │   │   └── elections/
│   │   ├── exports/
│   │   │   └── page.tsx           # Export history
│   │   └── compliance/
│   │       └── page.tsx           # Compliance reports
│   ├── components/
│   │   ├── ui/                    # Shadcn/UI primitives
│   │   ├── forms/                 # Form components
│   │   └── data-display/          # Tables, cards, etc.
│   └── lib/
│       ├── api/                   # API client
│       └── hooks/                 # Custom hooks
```

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Canonical PRD | docs/prd/PRD.md |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| Canonical ERD | client_subhive_schema.sql |
| UI ERD | docs/ui/UI_ERD_client-subhive.md |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-01-30 |
| Version | 1.0.0 |
| Status | ACTIVE |
| Authority | Derived from PRD.md |
