# Claude Bootstrap Guide - Client Intake & Vendor Export System

## Repository Identity

| Field | Value |
|-------|-------|
| **Repository** | djb258/client |
| **Hub ID** | client-subhive |
| **Hub Name** | Client Intake & Vendor Export System |
| **Parent Sovereign** | imo-creator |
| **Doctrine Version** | 3.4.1 |

---

## READ THESE FIRST

Before making ANY changes, read these files in order:

1. `IMO_CONTROL.json` — Machine-enforced governance contract
2. `CONSTITUTION.md` — Sovereign boundary declaration
3. `DOCTRINE.md` — Doctrine adherence and binding documents
4. `docs/prd/PRD.md` — Hub definition and transformation statement

---

## Parent-Child Relationship

```
imo-creator (Sovereign - CC-01)
    │
    └── client (Hub - CC-02)
            │
            ├── API Intake Endpoint (Spoke - CC-03, Ingress)
            ├── Vendor Export API (Spoke - CC-03, Egress)
            └── Compliance Report (Spoke - CC-03, Egress)
```

**This repository inherits doctrine from `imo-creator`.**

- Templates and constitutional documents flow DOWN from the parent
- Child repos MUST NOT modify parent doctrine
- If rules conflict, parent doctrine wins — no exceptions

### Binding Doctrine (from imo-creator)

| Document | Purpose |
|----------|---------|
| ARCHITECTURE.md (v2.1.0) | CTB Constitutional Law (CTB, CC, Hub-Spoke, IMO, Descent, OWN-10) |
| TEMPLATE_IMMUTABILITY.md | AI modification prohibition |
| CTB_REGISTRY_ENFORCEMENT.md (v1.5.0) | Registry-first enforcement, cardinality, drift audit |
| EXECUTION_SURFACE_LAW.md (v1.0.0) | Code placement whitelist, side-door prohibition |
| FAIL_CLOSED_CI_CONTRACT.md (v1.1.0) | Fail-closed CI gates, no continue-on-error |
| LEGACY_COLLAPSE_PLAYBOOK.md (v1.0.0) | 5-phase legacy migration protocol |
| IMO_SYSTEM_SPEC.md | System index and quick reference |
| AI_EMPLOYEE_OPERATING_CONTRACT.md | Agent constraints |
| SNAP_ON_TOOLBOX.yaml | Tool registry |
| GUARDSPEC.md | CI-style enforcement rules |

> **Note**: ARCHITECTURE.md consolidates the former CANONICAL_ARCHITECTURE_DOCTRINE.md, HUB_SPOKE_ARCHITECTURE.md, and ALTITUDE_DESCENT_MODEL.md. Adds OWN-10a/10b/10c table cardinality.

---

## Canonical Chain (CC) Layers

The system operates on a 4-layer authority hierarchy:

| Layer | Name | Authority | This Repo |
|-------|------|-----------|-----------|
| CC-01 | Sovereign | imo-creator | Parent (inherited) |
| CC-02 | Hub | client-subhive | This repository |
| CC-03 | Spoke/Context | Interfaces | API endpoints, exports |
| CC-04 | Process | Execution | PIDs, agent runs |

**Authorization flows DOWN only.** CC-04 cannot modify CC-02. CC-02 cannot modify CC-01.

---

## The Transformation Law

> "Nothing may exist unless it transforms declared constants into declared variables."

This hub transforms:
- **Constants (Inputs):** Raw client intake data, employee census, benefit elections
- **Variables (Outputs):** Canonical Neon records, vendor-specific export files

If something doesn't serve this transformation, it doesn't belong here.

---

## IMO Model (Ingress / Middle / Egress)

| Layer | Role | Rules |
|-------|------|-------|
| **I - Ingress** | Dumb input only | No logic, no state, no decisions |
| **M - Middle** | ALL logic lives here | Canonical data, validation, transformation |
| **O - Egress** | Output only | Read-only projection, no logic |

### Tables (clnt schema — 16 tables, 5 spokes)

**S1 Hub** — Client identity (SPINE)
- `client` (CANONICAL) — Sovereign identity, config, branding
- `client_error` (ERROR) — Client-level errors

**S2 Plan** — Benefit plans & quotes
- `plan` (CANONICAL) — Benefit type, rates, quote lineage
- `plan_error` (ERROR) — Plan-level errors
- `plan_quote` (SUPPORT) — Quote tracking

**S3 Employee** — Employee identity & enrollment
- `person` (CANONICAL) — Employee/dependent identity
- `employee_error` (ERROR) — Employee-level errors
- `election` (SUPPORT) — Person-plan bridge
- `enrollment_intake` (STAGING) — Batch header
- `intake_record` (STAGING) — Raw payload

**S4 Vendor** — Vendor identity & billing
- `vendor` (CANONICAL) — Vendor identity per client
- `vendor_error` (ERROR) — Vendor-level errors
- `external_identity_map` (SUPPORT) — ID translation
- `invoice` (SUPPORT) — Vendor invoices

**S5 Service** — Service tickets
- `service_request` (CANONICAL) — Service tickets
- `service_error` (ERROR) — Service-level errors

---

## CTB Structure (Christmas Tree Backbone)

```
client/
├── src/                        # Code lives here (CTB branches)
│   ├── sys/                    # System infrastructure, scripts
│   ├── data/                   # Database schemas, migrations
│   ├── app/                    # Application logic
│   ├── ai/                     # Agents, MCP servers
│   └── ui/                     # User interface
├── docs/                       # Governance documentation
│   ├── prd/                    # Product Requirements
│   ├── adr/                    # Architecture Decisions
│   ├── audit/                  # Audit attestations
│   └── ui/                     # UI governance
├── doctrine/                   # Domain specifications
├── templates/                  # IMO-Creator templates (synced)
├── integrations/               # External service docs
├── db/                         # Database migrations
├── erd/                        # ERD metrics
├── scripts/                    # Root-level scripts
└── [root governance files]     # IMO_CONTROL, CONSTITUTION, etc.
```

### Forbidden Folders

NEVER create these folders anywhere:
- `utils/`
- `helpers/`
- `common/`
- `shared/`
- `lib/`
- `misc/`

---

## Governance Files

| File | Purpose | Authority |
|------|---------|-----------|
| `IMO_CONTROL.json` | Machine-enforced rules | CC-02 |
| `CONSTITUTION.md` | Boundary declaration | CC-02 |
| `REGISTRY.yaml` | Hub identity | CC-02 |
| `DOCTRINE.md` | Doctrine adherence | CC-02 |
| `HUB_DESIGN_DECLARATION.yaml` | Hub existence justification (HSS) | CC-02 |
| `doctrine/REPO_DOMAIN_SPEC.md` | Domain bindings | CC-02 |
| `doctrine/OSAM.md` | Semantic Access Map (query routing) | CC-02 |
| `docs/prd/PRD.md` | Hub definition | CC-02 |
| `docs/adr/ADR-001-architecture.md` | Architecture decisions | CC-03 |
| `docs/audit/HUB_COMPLIANCE_CHECKLIST.md` | Compliance checklist | CC-02 |
| `docs/CTB_GOVERNANCE.md` | CTB table registry and governance | CC-02 |
| `docs/architecture/HUBS_AND_SPOKES.md` | Hub/spoke reference (explanatory) | CC-02 |
| `docs/architecture/SYSTEM_FUNNEL_OVERVIEW.md` | System funnel reference (explanatory) | CC-02 |

### UI Governance

| File | Purpose |
|------|---------|
| `docs/ui/UI_CONSTITUTION.md` | UI layer governance |
| `docs/ui/UI_PRD_client-subhive.md` | UI surface definitions |
| `docs/ui/UI_ERD_client-subhive.md` | Read-only data mirror |

**UI owns no schema, no persistence, no business logic.**

---

## Secrets Management (Doppler)

**Doppler is the ONLY permitted secrets provider.**

```bash
# Setup (run once)
doppler setup

# Run any command with secrets
doppler run -- <command>

# Examples
doppler run -- npm start
doppler run -- node scripts/sync_erd_metrics.js
```

### Required Secrets

| Secret | Purpose | Required |
|--------|---------|----------|
| `HUB_ID` | Hub identifier | Yes |
| `NEON_DATABASE_URL` | Database connection | Yes |

### Forbidden

```
╔══════════════════════════════════════════════════════════════════════╗
║                         FORBIDDEN PATTERNS                            ║
╠══════════════════════════════════════════════════════════════════════╣
║   ❌ .env files (any variant)                                        ║
║   ❌ Hardcoded secrets in code                                       ║
║   ❌ secrets.json, credentials.json                                  ║
║   ❌ Environment variables not from Doppler                          ║
║   ❌ Firebase (deprecated)                                           ║
║   ❌ Vercel (deprecated)                                             ║
║   ❌ N8N (deprecated)                                                ║
╚══════════════════════════════════════════════════════════════════════╝
```

See: `integrations/DOPPLER.md`

---

## V1 Control Plane (v3.4.1 — Agent System)

This repo uses the IMO-Creator V1 Control Plane with 4 agents and a folder-based message bus.

### Agents

| Agent | Role | Produces | Reads From |
|-------|------|----------|------------|
| **Planner** | Plans work, classifies change type | WORK_PACKET | User request + constitutional docs |
| **Builder** | Executes approved plans | CHANGESET + pressure reports | work_packets/inbox |
| **Auditor** | Verifies compliance | AUDIT_REPORT | work_packets/inbox + changesets/inbox |
| **Control Panel** | Read-only diagnostic | Structured report | All bus folders (read-only) |

### Message Bus (Folder-Based)

```
work_packets/inbox/     ← Builder reads from here
work_packets/outbox/    ← Planner writes here
changesets/inbox/       ← Auditor reads from here
changesets/outbox/      ← Builder writes here
audit_reports/inbox/    ← (future consumers)
audit_reports/outbox/   ← Auditor writes here
audit/                  ← Pressure test reports
```

### Agent Contracts

| Contract | Schema | Purpose |
|----------|--------|---------|
| WORK_PACKET | `agents/contracts/work_packet.schema.json` | Planned scope of work |
| CHANGESET | `agents/contracts/changeset.schema.json` | Completed changes |
| AUDIT_REPORT | `agents/contracts/audit_report.schema.json` | Compliance classification |
| ARCH_PRESSURE_REPORT | `agents/contracts/arch_pressure_report.schema.json` | 5 structural invariants |
| FLOW_PRESSURE_REPORT | `agents/contracts/flow_pressure_report.schema.json` | 5 flow invariants |

### Pressure Tests (v3.4.1 — 10 Mechanical Gates)

When `requires_pressure_test = true` (mandatory for architectural changes):

**Structural (5 gates):** cantonal_cardinality, registry_first, id_authority, no_sideways_calls, contracts_declared

**Flow (5 gates):** ingress_contract_exists, egress_contract_exists, no_orphan_tables, no_unconsumed_events, id_propagation_intact

All 10 must = PASS. Any FAIL blocks merge. No advisory override permitted.

### Constitutional Docs

| File | Purpose |
|------|---------|
| `docs/constitutional/backbone.md` | CTB backbone primitives, altitude hierarchy |
| `docs/constitutional/governance.md` | Agent role isolation, artifact flow, pressure test bus |
| `docs/constitutional/protected_assets.md` | Protected models and folders |

---

## Enforcement Scripts

| Script | Purpose | Run When |
|--------|---------|----------|
| `scripts/ctb-registry-gate.sh` | Registry vs migrations + cardinality | Pre-commit, CI |
| `scripts/ctb-drift-audit.sh` | Live DB vs registry vs YAML (3-surface) | CI, on-demand |
| `scripts/detect-banned-db-clients.sh` | Banned DB client imports | Pre-commit, CI |
| `scripts/verify-governance-ci.sh` | CI governance wiring | Bootstrap, CI |
| `scripts/bootstrap-audit.sh` | Day 0 structural validation | Initial setup |

---

## Registry-First Architecture

Single source of truth: `src/data/db/registry/clnt_column_registry.yml`

```
OSAM → column_registry.yml → codegen-schema.ts → Generated files → Application code
```

**Golden rule**: If it can be derived, it MUST be derived. Never hand-edit generated files.

| Generated File | Location | Source |
|----------------|----------|--------|
| types.ts (per spoke) | `src/data/spokes/s{n}-*/types.ts` | Registry |
| schema.ts (per spoke) | `src/data/spokes/s{n}-*/schema.ts` | Registry |
| index.ts (barrel) | `src/data/spokes/index.ts` | Registry |
| ERD.md | `src/data/ERD.md` | Registry |

---

## Gatekeeper Module

All database writes MUST go through: `src/sys/modules/gatekeeper/`

No direct DB client imports allowed (pg, mysql2, psycopg2, etc.). The `detect-banned-db-clients.sh` script enforces this.

---

## Common Tasks

| Task | How To |
|------|--------|
| Add database table | Register in column_registry.yml FIRST → ADR → migration → run codegen |
| Add new agent | `src/ai/` → update PRD |
| Update UI | `src/ui/` → follow `docs/ui/UI_CONSTITUTION.md` |
| Add integration | `integrations/` → update REGISTRY.yaml |
| Run codegen | `npx ts-node scripts/codegen-schema.ts` |
| Verify codegen drift | `npm run codegen:verify` |
| Run registry gate | `bash scripts/ctb-registry-gate.sh` |
| Run drift audit | `DATABASE_URL=... bash scripts/ctb-drift-audit.sh` |
| Run bootstrap audit | `DATABASE_URL=... bash scripts/bootstrap-audit.sh` |

---

## Never Do These Things

```
╔══════════════════════════════════════════════════════════════════════╗
║                           HARD PROHIBITIONS                           ║
╠══════════════════════════════════════════════════════════════════════╣
║   ❌ Modify parent doctrine (imo-creator templates)                  ║
║   ❌ Create files outside CTB branches (src/)                        ║
║   ❌ Put logic in Ingress or Egress layers                           ║
║   ❌ Use .env files                                                  ║
║   ❌ Hardcode secrets                                                ║
║   ❌ Create forbidden folders (utils, helpers, lib, etc.)            ║
║   ❌ Create schema without ADR                                       ║
║   ❌ Make UI own data or logic                                       ║
║   ❌ Skip the CC descent sequence                                    ║
║   ❌ Use direct DB clients (must use Gatekeeper)                     ║
║   ❌ Create tables without registering in column_registry.yml first  ║
║   ❌ Use continue-on-error in CI enforcement jobs                    ║
║   ❌ Connect to database as superuser                                ║
║   ❌ Override or downgrade pressure test FAIL to advisory            ║
║   ❌ Hand-edit generated files (types.ts, schema.ts, ERD.md)         ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Key Integrations

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Neon | PostgreSQL database (clnt schema) | `db/neon/` |
| Doppler | Secrets management | `integrations/DOPPLER.md` |

---

## If You Get Stuck

1. Re-read `DOCTRINE.md` for binding rules
2. Check `docs/prd/PRD.md` for scope boundaries
3. Review `docs/adr/ADR-001-architecture.md` for decisions
4. If rules conflict, parent doctrine wins
5. When in doubt, ask — don't assume

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-02-25 |
| Version | 3.4.1 |
| Status | ACTIVE |
