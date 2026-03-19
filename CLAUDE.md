# CLAUDE.md — Client Intake & Vendor Export System

## Identity

This is a **blueprint repo** — schema, doctrine, definitions. ZERO runtime code.
All executable processes live in **Barton-Processes** (800-series).

**Authority**: Inherited from imo-creator-v2 (Sovereign)
**Engine**: `law/doctrine/TIER0_DOCTRINE.md` (in imo-creator-v2)

| Field | Value |
|-------|-------|
| **Repository** | djb258/client |
| **Hub ID** | client-subhive |
| **Hub Name** | Client Intake & Vendor Export System |
| **Parent Sovereign** | imo-creator-v2 |
| **Doctrine Version** | 2.0.0 |

---

## CANONICAL REFERENCE

| Template | imo-creator-v2 Path | Version |
|----------|---------------------|---------|
| Architecture | law/doctrine/ARCHITECTURE.md | 2.1.0 |
| Tier 0 | law/doctrine/TIER0_DOCTRINE.md | LOCKED |
| Critical Thinking | law/doctrine/CRITICAL_THINKING_FRAMEWORK.md | LOCKED |
| Tools | law/integrations/TOOLS.md | 1.1.0 |
| OSAM | law/semantic/OSAM.md | 1.1.0 |
| PRD | fleet/car-template/docs/PRD_HUB.md | 1.0.0 |
| ADR | fleet/adr-templates/ADR.md | 1.0.0 |
| Checklist | fleet/checklists/HUB_COMPLIANCE.md | 1.0.0 |

---

## Blueprint, Not Muscle

This repo defines WHAT. Barton-Processes defines HOW.

| This Repo (Blueprint) | Barton-Processes (Muscle) |
|------------------------|--------------------------|
| Schema (column registry) | CF Workers (800-830) |
| OSAM (query routing) | D1 working tables |
| PRD (transformation statement) | Neon vault migrations |
| Vendor blueprints (field mappings) | Export generation |
| Doctrine, governance, ADRs | Runtime execution |

**No executable code belongs here.** If it runs, it goes in Barton-Processes.

---

## Processes (in Barton-Processes)

| # | Name | What It Does |
|---|------|-------------|
| 800 | Client Mint | CL sovereign ID → mint client_id → D1 → vault to Neon |
| 810 | Client Data Intake | CSV/API → Zod validate → D1 staging → promote canonical → vault |
| 820 | Vendor Export | Cron → D1 canonical → vendor blueprint mapping → export files |
| 830 | Client Portal | 5 pages (renewal, CEO, HR, underwriting, agent) → SSR HTML |

---

## Data Hierarchy

```
CL (Company Lifecycle — sovereign ID)
├── Outreach ID (sub-hub)
├── Sales ID (sub-hub)
└── Client ID (sub-hub) ← THIS REPO
    ├── S1 Hub — client identity (SPINE)
    ├── S2 Plan — benefits, rates, renewal quotes
    ├── S3 Employee — enrollment, person, elections
    ├── S4 Vendor — vendor identity, ID translation, invoices
    └── S5 Service — service tickets
```

**CL sovereign ID is the spine.** Client identity is minted from it (Process 800).

---

## Infrastructure Layers

| Layer | Technology | Role |
|-------|-----------|------|
| Working | CF D1 | All active operations — staging, validation, canonical working copy |
| Config | CF KV | Vendor blueprints, schedule config |
| Compute | CF Workers | All processing logic |
| Vault | Neon PostgreSQL | Long-term canonical storage — promote when certified |
| Secrets | Doppler (imo-creator project) | All runtime configuration |

**CF does the work. Neon is the vault.**

---

## Schema (16 Tables, 5 Spokes)

Single source of truth: `src/data/db/registry/clnt_column_registry.yml`

| Spoke | CANONICAL | ERROR | Additional |
|-------|-----------|-------|------------|
| S1 Hub | client | client_error | — |
| S2 Plan | plan | plan_error | plan_quote (SUPPORT) |
| S3 Employee | person | employee_error | election (SUPPORT), enrollment_intake (STAGING), intake_record (STAGING) |
| S4 Vendor | vendor | vendor_error | external_identity_map (SUPPORT), invoice (SUPPORT) |
| S5 Service | service_request | service_error | — |

**Universal join key:** `client_id` (from clnt.client)

---

## IMO Model

| Layer | Role | Rules |
|-------|------|-------|
| **I - Ingress** | Dumb input only | No logic, no state, no decisions |
| **M - Middle** | ALL logic lives here | Canonical data, validation, transformation |
| **O - Egress** | Output only | Read-only projection, no logic |

---

## Governance Files

| File | Purpose |
|------|---------|
| `IMO_CONTROL.json` | Machine-enforced governance contract |
| `CONSTITUTION.md` | Boundary declaration |
| `DOCTRINE.md` | Doctrine adherence |
| `REGISTRY.yaml` | Hub identity |
| `HUB_DESIGN_DECLARATION.yaml` | Hub existence justification |
| `doctrine/REPO_DOMAIN_SPEC.md` | Domain bindings + lane definitions |
| `doctrine/OSAM.md` | Semantic Access Map (query routing) |
| `docs/prd/PRD.md` | Hub definition + transformation statement |

---

## Secrets Management (Doppler)

**All secrets live in the imo-creator Doppler project.** This is the sovereign vault.

Relevant keys:
- `CLIENT_DATABASE_URL` — Neon connection string
- `CLIENT_HUB_ID` — client-subhive
- `CLIENT_NEON_HOST`, `CLIENT_NEON_USER`, `CLIENT_NEON_PASSWORD`, `CLIENT_NEON_DATABASE`

```
FORBIDDEN:
- .env files (any variant)
- Hardcoded secrets in code
- secrets.json, credentials.json
- Environment variables not from Doppler
```

---

## Registry-First Architecture

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

## Vendor Blueprints

Field mappings for export generation (consumed by Process 820):

| File | Vendor |
|------|--------|
| `db/vendor_blueprints/guardian_life.mapping.json` | Guardian Life |
| `db/vendor_blueprints/mutual_of_omaha.mapping.json` | Mutual of Omaha |

---

## Never Do These Things

```
HARD PROHIBITIONS:
- Put executable code in this repo (it goes in Barton-Processes)
- Modify parent doctrine (imo-creator-v2)
- Put logic in Ingress or Egress layers
- Use .env files or hardcode secrets
- Create forbidden folders (utils, helpers, lib, etc.)
- Create schema without ADR
- Create tables without registering in column_registry.yml first
- Hand-edit generated files (types.ts, schema.ts, ERD.md)
- Make UI own data or logic
```

---

## Golden Rules

1. **This repo is a blueprint. Barton-Processes is the muscle.**
2. **Tier 0 is the engine. Everything else is fuel.**
3. **CF does the work. Neon is the vault.**
4. **CL sovereign ID is the spine. Client ID is minted from it.**
5. **Children conform to parent. Never the reverse.**
6. **Determinism first. LLM is tail, not spine.**

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-03-19 |
| Version | 2.0.0 |
| Status | ACTIVE |
| Authority | imo-creator-v2 (Inherited) |
