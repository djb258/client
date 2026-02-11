# UI Constitution

**Status**: ACTIVE
**Authority**: Derived from IMO_CONTROL.json
**Version**: 1.0.0

---

## Purpose

This document establishes the governance framework for all UI implementations within the Client Intake & Vendor Export System hub.

**The UI layer is presentation-only. It owns no schema, no persistence, and no business logic.**

---

## Authority Chain

```
IMO_CONTROL.json (machine authority)
        ↓
CONSTITUTION.md (hub governance)
        ↓
UI_CONSTITUTION.md (this document)
        ↓
UI_PRD_client-subhive.md
        ↓
UI_ERD_client-subhive.md
        ↓
UI implementation (tool-specific)
```

---

## Core Principles

### 1. UI Derives Authority

The UI layer derives ALL authority from the hub's governance documents. It cannot:
- Create new data structures
- Define new business rules
- Establish new workflows

### 2. UI is Presentation-Only

The UI exists solely to:
- Display data from canonical sources
- Collect user input
- Emit intents/events to the Middle layer

### 3. UI is Disposable and Regenerable

All UI governance artifacts can be regenerated from canonical system doctrine. The UI implementation is:
- Tool-agnostic (React, Vue, etc. are implementation details)
- Fully replaceable without data loss
- Derived, not authoritative

---

## UI-Specific IMO Discipline

| Layer | Role | Permitted Actions |
|-------|------|-------------------|
| **Ingress** | User input only | Form fields, file uploads, user selections |
| **Middle** | Layout + ephemeral state only | Component state, view models, navigation state |
| **Egress** | Intent/event emission only | API calls, event dispatching, navigation requests |

---

## Explicit Prohibitions

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           FORBIDDEN IN UI LAYER                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ❌ Schema mutation (CREATE TABLE, ALTER TABLE)                             ║
║   ❌ Table creation or modification                                          ║
║   ❌ Join definitions (joins are owned by Middle layer)                      ║
║   ❌ Business logic execution                                                ║
║   ❌ Data persistence (localStorage for auth tokens only)                    ║
║   ❌ Direct database access                                                  ║
║   ❌ Workflow orchestration                                                  ║
║   ❌ Validation beyond format checking                                       ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## UI Governance Artifacts

| Artifact | Purpose | Location |
|----------|---------|----------|
| UI_CONSTITUTION.md | Prose governance (this document) | `docs/ui/` |
| UI_PRD_client-subhive.md | UI surface definitions | `docs/ui/` |
| UI_ERD_client-subhive.md | Read-only data model mirror | `docs/ui/` |

---

## What UI Can Do

### Permitted

- Render data from API responses
- Collect user input via forms
- Manage ephemeral component state
- Emit events/intents to APIs
- Display loading/error states
- Navigate between views
- Format data for display (dates, currency, etc.)

### Requires API Support

- Data validation (beyond format)
- Business rule enforcement
- Data persistence
- Workflow progression

---

## Relationship to Canonical Doctrine

| System Artifact | UI Mirror | Relationship |
|-----------------|-----------|--------------|
| PRD.md | UI_PRD_client-subhive.md | UI PRD is subordinate |
| Database Schema | UI_ERD_client-subhive.md | 1:1 read-only mirror |
| IMO_CONTROL.json | (none) | UI derives authority |

---

## Change Protocol

1. UI governance changes require ADR
2. UI_ERD must remain in sync with canonical ERD
3. UI_PRD must reflect current hub PRD scope
4. Human approval required for structural changes

---

## Success Criteria

| Criterion | Validation |
|-----------|------------|
| UI is tool-agnostic | No vendor-specific references in governance |
| UI mirrors system structure | 1:1 mapping to canonical PRD/ERD |
| UI cannot invent schema | All structure derived, not created |
| UI is replaceable | Another team can rebuild from artifacts alone |

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Machine Authority | IMO_CONTROL.json |
| Hub Constitution | CONSTITUTION.md |
| Hub Doctrine | DOCTRINE.md |
| Canonical PRD | docs/prd/PRD.md |
| Canonical Schema | clnt (Neon PostgreSQL) |
| Domain Bindings | doctrine/REPO_DOMAIN_SPEC.md |
| Bootstrap Guide | CLAUDE.md |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-02-11 |
| Version | 2.0.0 |
| Status | ACTIVE |
| Authority | Derived from IMO_CONTROL.json |
| Change Protocol | ADR + HUMAN APPROVAL REQUIRED |
