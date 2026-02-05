# Claude Bootstrap Guide - Client Intake & Vendor Export System

## Repository Identity

| Field | Value |
|-------|-------|
| **Repository** | djb258/client |
| **Hub ID** | client-subhive |
| **Hub Name** | Client Intake & Vendor Export System |
| **Parent Sovereign** | imo-creator |
| **Doctrine Version** | 1.5.0 |

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
| CANONICAL_ARCHITECTURE_DOCTRINE.md | Operating physics of the system |
| ALTITUDE_DESCENT_MODEL.md | CC layer descent sequence |
| TEMPLATE_IMMUTABILITY.md | AI modification prohibition |
| IMO_SYSTEM_SPEC.md | System index and quick reference |
| AI_EMPLOYEE_OPERATING_CONTRACT.md | Agent constraints |
| SNAP_ON_TOOLBOX.yaml | Tool registry |

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

| Layer | Prefix | Role | Rules |
|-------|--------|------|-------|
| **I - Ingress** | `clnt_i_*` | Dumb input only | No logic, no state, no decisions |
| **M - Middle** | `clnt_m_*` | ALL logic lives here | Canonical data, validation, transformation |
| **O - Egress** | `clnt_o_*` | Output only | Read-only projection, no logic |

### Tables (clnt2 schema)

**Ingress (I)** — Raw staging
- `clnt_i_raw_input` — Raw intake data
- `clnt_i_profile` — Source system profiles

**Middle (M)** — Canonical truth
- `clnt_m_client` — Client records
- `clnt_m_person` — Employee/dependent records
- `clnt_m_plan` — Benefit plans
- `clnt_m_plan_cost` — Plan costs
- `clnt_m_election` — Benefit elections
- `clnt_m_vendor_link` — Vendor associations
- `clnt_m_spd` — Summary Plan Descriptions

**Egress (O)** — Export/output
- `clnt_o_output` — Vendor exports
- `clnt_o_output_run` — Export runs
- `clnt_o_compliance` — Compliance reports

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
| `doctrine/REPO_DOMAIN_SPEC.md` | Domain bindings | CC-02 |
| `docs/prd/PRD.md` | Hub definition | CC-02 |
| `docs/adr/ADR-001-architecture.md` | Architecture decisions | CC-03 |
| `docs/audit/HUB_COMPLIANCE_CHECKLIST.md` | Compliance checklist | CC-02 |

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

## Common Tasks

| Task | How To |
|------|--------|
| Add database table | Requires ADR → `db/neon/migrations/` |
| Add new agent | `src/ai/` → update PRD |
| Update UI | `src/ui/` → follow `docs/ui/UI_CONSTITUTION.md` |
| Add integration | `integrations/` → update REGISTRY.yaml |
| Sync ERD metrics | `node scripts/sync_erd_metrics.js` |

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
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Key Integrations

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Neon | PostgreSQL database (clnt2 schema) | `db/neon/` |
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
| Last Modified | 2026-02-05 |
| Version | 1.1.0 |
| Status | ACTIVE |
