# UI PRD — Client Intake & Vendor Export System

**Status**: ACTIVE
**Authority**: Derived from docs/prd/PRD.md
**Version**: 2.0.0

---

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.0.0 |
| **Owning Hub** | client-subhive |
| **Canonical PRD** | docs/prd/PRD.md v2.0.0 |

---

## UI Identity

| Field | Value |
|-------|-------|
| **UI Name** | Client Intake Portal |
| **Owning Hub** | client-subhive |
| **Type** | Web Application |
| **Location** | src/ui/ |

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
| Plan Selection | Display available plans | `clnt.plan` (read) | `election.select` |
| Election Confirmation | Confirm benefit elections | User input | `election.confirm` |
| Quote Intake | Capture carrier renewal quotes | User input | `quote.create` |

### 2. Management Views (Middle UI - Read/Write)

| View | Purpose | Data Source | Events Emitted |
|------|---------|-------------|----------------|
| Client Dashboard | Display client overview | `clnt.client_hub` + `clnt.client_master` (read) | Navigation events |
| Employee List | Display employee roster | `clnt.person` (read) | `employee.view`, `employee.edit` |
| Plan Management | Display plan configurations | `clnt.plan` (read) | `plan.view` |
| Quote Comparison | Compare received quotes | `clnt.plan_quote` (read) | `quote.present`, `quote.select` |
| Election Review | Display current elections | `clnt.election` (read) | `election.modify` |
| Service Tickets | Display service requests | `clnt.service_request` (read) | `service.create`, `service.update` |

### 3. Export/Report Views (Egress UI - Read Only)

| View | Purpose | Data Source | Events Emitted |
|------|---------|-------------|----------------|
| Compliance Reports | Display compliance status | `clnt.compliance_flag` (read) | `report.download` |
| Vendor Status | Display vendor sync status | `clnt.vendor` + `clnt.external_identity_map` (read) | None (read-only) |

---

## Canonical Outputs Consumed (Read-Only)

| API Endpoint | Canonical Table | UI Usage |
|--------------|-----------------|----------|
| GET /api/clients | `clnt.client_hub` + `clnt.client_master` | Client list, dashboard |
| GET /api/clients/:id | `clnt.client_hub` + `clnt.client_master` | Client detail |
| GET /api/persons | `clnt.person` | Employee list |
| GET /api/plans | `clnt.plan` | Plan selection, rate display |
| GET /api/quotes | `clnt.plan_quote` | Quote comparison |
| GET /api/elections | `clnt.election` | Election review |
| GET /api/vendors | `clnt.vendor` | Vendor status |
| GET /api/compliance | `clnt.compliance_flag` | Compliance reports |
| GET /api/service-requests | `clnt.service_request` | Service ticket list |

---

## Events Emitted (Intents)

| Event | Trigger | Payload | Handler |
|-------|---------|---------|---------|
| `company.create` | Form submit | Company data | API -> client_master |
| `company.update` | Form submit | Updated fields | API -> client_master |
| `employee.create` | Form submit | Employee data | API -> person |
| `employee.import` | File upload | CSV/Excel data | API -> intake_batch -> intake_record |
| `quote.create` | Form submit | Quote data | API -> plan_quote |
| `quote.present` | Action button | Quote IDs | API -> plan_quote (status update) |
| `quote.select` | Action button | Selected quote ID | API -> plan_quote (status update) + plan (promotion) |
| `election.select` | Plan selection | Plan + person IDs | API -> election |
| `election.confirm` | Confirmation | Election bundle | API -> election |
| `service.create` | Form submit | Service request data | API -> service_request |
| `report.download` | Button click | Report config | API -> compliance_flag (read) |

---

## Failure States (Display Only)

| Failure | UI Response | User Action |
|---------|-------------|-------------|
| API unavailable | Error banner + retry button | Retry or contact support |
| Validation error | Field-level error messages | Correct input |
| Session expired | Redirect to login | Re-authenticate |
| Permission denied | Access denied message | Contact admin |
| Quote promotion conflict | Error notification | Review existing plans, retry |

---

## Surface Classification

### Read-Only Surfaces

- Client Dashboard
- Employee List (view mode)
- Plan Details (rates are read-only)
- Quote Comparison (read-only, actions via buttons)
- Compliance Reports
- Vendor Status
- Service Ticket Detail

### Event-Emitting Surfaces

- Company Setup Form
- Employee Census Form
- Quote Intake Form
- Plan Selection
- Election Confirmation
- Service Ticket Form
- Quote Promotion Actions

---

## Explicit Forbidden Behaviors

```
+==============================================================================+
|                     FORBIDDEN IN THIS UI                                      |
+==============================================================================+
|                                                                               |
|   NO Direct database queries                                                  |
|   NO Business rule calculations (premium, compliance, etc.)                   |
|   NO Workflow state management                                                |
|   NO Cross-client data access                                                 |
|   NO Vendor API calls (handled by agents)                                     |
|   NO Compliance determination                                                 |
|   NO Data transformation beyond display formatting                            |
|   NO Caching canonical data (always fetch fresh)                              |
|   NO Direct query of STAGING tables (S3: intake)                              |
|   NO Direct query of AUDIT tables (S8: audit_event)                           |
|                                                                               |
+==============================================================================+
```

---

## Component Structure (Recommended)

```
src/ui/
  src/
    app/
      layout.tsx
      page.tsx
      clients/
        page.tsx                 # Client list
        [id]/
          page.tsx               # Client detail
      intake/
        company/
        employees/
        elections/
      quotes/
        page.tsx                 # Quote comparison
        new/
          page.tsx               # Quote intake form
      service/
        page.tsx                 # Service ticket list
        new/
          page.tsx               # New service ticket
      compliance/
        page.tsx                 # Compliance reports
    components/
      ui/                        # Shadcn/UI primitives
      forms/                     # Form components
      data-display/              # Tables, cards, etc.
    lib/
      api/                       # API client
      hooks/                     # Custom hooks
```

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Canonical PRD | docs/prd/PRD.md v2.0.0 |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| Canonical ERD | db/neon/migrations/SCHEMA_ER_DIAGRAM.md v2.2.0 |
| UI ERD | docs/ui/UI_ERD_client-subhive.md v2.0.0 |
| OSAM | doctrine/OSAM.md v2.0.0 |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-02-11 |
| Version | 2.0.0 |
| Status | ACTIVE |
| Authority | Derived from PRD.md v2.0.0 |
