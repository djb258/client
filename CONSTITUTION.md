# Constitution

**This repository is a governed child system.**

---

## Sovereign Declaration

| Field | Value |
|-------|-------|
| **Parent Authority** | imo-creator |
| **Sovereignty Type** | INHERITED |
| **Hub ID** | client-subhive |
| **Hub Name** | Client Intake & Vendor Export System |
| **Created** | 2026-01-30 |
| **Status** | ACTIVE |

---

## Governing Authority

This repository operates under the authority of **imo-creator**.

All doctrine, templates, and governance rules flow from the parent repository.
This is a one-way inheritance: Parent → Child. Never Child → Parent.

---

## Boundary Declarations

### What This Repository MAY Do

- Implement business logic within the M (Middle) layer
- Create domain-specific tables following IMO naming conventions
- Define spokes (interfaces) at CC-03
- Execute processes at CC-04 with proper PID tracking
- Fill in templates from the parent repository

### What This Repository MAY NOT Do

- Modify parent doctrine files
- Escalate sovereignty (declare itself as parent)
- Interpret doctrine beyond its explicit meaning
- Create forbidden folders (utils, helpers, common, shared, lib, misc)
- Skip CC descent gates
- Change template structure

---

## Secrets Policy (MANDATORY)

```
╔══════════════════════════════════════════════════════════════════════╗
║                      DOPPLER ENFORCEMENT POLICY                       ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║   Doppler is the ONLY permitted secrets provider.                    ║
║                                                                       ║
║   FORBIDDEN:                                                          ║
║   - .env files (any variant)                                         ║
║   - Hardcoded secrets in code                                        ║
║   - Local secret files (secrets.json, credentials.json)              ║
║   - Environment variables not sourced from Doppler                   ║
║                                                                       ║
║   All runtime configuration MUST be sourced via Doppler.             ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Doctrine Reference

All operations in this repository are bound by:

### Parent Doctrine (from imo-creator)

| Document | Location | Purpose |
|----------|----------|---------|
| ARCHITECTURE.md (v2.0.0) | imo-creator/templates/doctrine/ | CTB Constitutional Law (CTB, CC, Hub-Spoke, IMO, Descent) |
| TEMPLATE_IMMUTABILITY.md | imo-creator/templates/doctrine/ | AI modification prohibition |
| IMO_SYSTEM_SPEC.md | imo-creator/templates/ | System index |
| AI_EMPLOYEE_OPERATING_CONTRACT.md | imo-creator/templates/ | Agent constraints |
| SNAP_ON_TOOLBOX.yaml | imo-creator/templates/ | Tool registry |

### Local Governance (this repository)

| Document | Location | Purpose |
|----------|----------|---------|
| CLAUDE.md | / (root) | Bootstrap guide for agents |
| IMO_CONTROL.json | / (root) | Machine-enforced rules |
| DOCTRINE.md | / (root) | Doctrine adherence |
| REGISTRY.yaml | / (root) | Hub identity |
| PRD.md | docs/prd/ | Hub definition |
| ADR-001-architecture.md | docs/adr/ | Architecture decisions |
| REPO_DOMAIN_SPEC.md | doctrine/ | Domain bindings |
| UI_CONSTITUTION.md | docs/ui/ | UI governance |

---

## Conflict Resolution

If any rule in this repository conflicts with parent doctrine:

1. **Parent doctrine wins.** No exceptions.
2. Document the conflict in an ADR.
3. Escalate to human for resolution.
4. Do NOT proceed until resolved.

---

## AI Agent Constraints

AI agents operating in this repository:

- MUST read IMO_CONTROL.json before any work
- MUST check for violations before proceeding
- MUST halt and report if violations exist
- MUST NOT modify doctrine files
- MUST NOT reinterpret rules
- MUST NOT invent structure beyond what doctrine defines

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Authority | imo-creator (inherited) |
| Type | Constitutional Declaration |
| Status | ACTIVE |
