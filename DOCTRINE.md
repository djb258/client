# Doctrine Reference

This repository is governed by **IMO-Creator**.

---

## Conformance Declaration

| Field | Value |
|-------|-------|
| **Parent** | imo-creator |
| **Sovereignty** | INHERITED |
| **Doctrine Version** | 1.0.0 |
| **CTB Version** | 1.0.0 |

---

## Binding Documents

This repository conforms to the following doctrine files from IMO-Creator:

| Document | Purpose | Location |
|----------|---------|----------|
| CANONICAL_ARCHITECTURE_DOCTRINE.md | Operating physics | imo-creator/templates/doctrine/ |
| ALTITUDE_DESCENT_MODEL.md | CC descent sequence | imo-creator/templates/doctrine/ |
| TEMPLATE_IMMUTABILITY.md | AI modification prohibition | imo-creator/templates/doctrine/ |
| SNAP_ON_TOOLBOX.yaml | Tool registry | imo-creator/templates/ |
| IMO_SYSTEM_SPEC.md | System index | imo-creator/templates/ |
| AI_EMPLOYEE_OPERATING_CONTRACT.md | Agent constraints | imo-creator/templates/ |

---

## Doctrine Adherence

This repository operates under:

### IMO (Ingress/Middle/Egress)
- All data tables follow IMO prefix convention
- `clnt_i_*` = Ingress (input staging)
- `clnt_m_*` = Middle (canonical data, all logic)
- `clnt_o_*` = Egress (output/export)

### CTB (Christmas Tree Backbone)
- 6-branch structure: `sys/`, `data/`, `ai/`, `ui/`, `docs/`, `meta/`
- All files placed in appropriate CTB branch
- Forbidden folders: `utils/`, `helpers/`, `common/`, `shared/`, `lib/`, `misc/`

### ORBT (Operational Repair, Build, Troubleshooting)
- System responsibility model for maintenance operations
- Automated compliance checking enabled

### HEIR (Hierarchical Execution Intelligence & Repair)
- Altitude-based agent coordination
- 30k ft: Strategic orchestration
- 20k ft: Tactical validation
- 10k ft: Implementation
- 5k ft: Verification

---

## Domain-Specific Bindings

This repository's domain-specific bindings are declared in:

```
doctrine/REPO_DOMAIN_SPEC.md
```

This file maps generic roles to domain-specific tables and concepts.

---

## UI Governance

UI implementations MUST follow these governance documents:

| Document | Purpose |
|----------|---------|
| docs/ui/UI_CONSTITUTION.md | UI layer governance |
| docs/ui/UI_PRD_client-subhive.md | UI surface definitions |
| docs/ui/UI_ERD_client-subhive.md | Read-only data mirror |

**The UI layer owns no schema, no persistence, no business logic.**

---

## Secrets Policy

```
╔══════════════════════════════════════════════════════════════════════╗
║                          DOPPLER ENFORCEMENT                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   Doppler is the ONLY permitted secrets provider.                    ║
║                                                                       ║
║   FORBIDDEN:                                                          ║
║   - .env files (any variant)                                         ║
║   - Hardcoded secrets in code                                        ║
║   - Local secret files                                               ║
║                                                                       ║
║   All runtime configuration MUST be sourced via Doppler.             ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Authority Rule

> Parent doctrine is READ-ONLY.
> Domain specifics live in REPO_DOMAIN_SPEC.md.
> If rules conflict, parent wins.

---

## Bootstrap Guide

For quick onboarding, read:

```
CLAUDE.md
```

This file provides a comprehensive overview of the repository structure, governance, and common tasks.

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-01-30 |
| Status | ACTIVE |
