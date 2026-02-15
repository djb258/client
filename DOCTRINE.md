# Doctrine Reference

This repository is governed by **IMO-Creator**.

---

## Conformance Declaration

| Field | Value |
|-------|-------|
| **Parent** | imo-creator |
| **Sovereignty** | INHERITED |
| **Doctrine Version** | 2.1.0 |
| **Manifest Version** | 2.8.0 |
| **CTB Version** | 2.0.0 |

---

## 3-Tier Loading System

Agents MUST load TIER 1 before any work. TIER 2 loads on-demand. TIER 3 is audit-only.

### TIER 1 — MANDATORY (load before any work)

| File | Purpose |
|------|---------|
| `IMO_CONTROL.json` | Hub identity, governance contract |
| `CC_OPERATIONAL_DIGEST.md` | ALL operational rules in one file (~500 lines) |
| `CLAUDE.md` | AI permissions, repo-specific rules |

### TIER 2 — ON-DEMAND (load when working in that domain)

| File | Domain | Trigger |
|------|--------|---------|
| `REGISTRY.yaml` | Hub identity, structure | Structural or identity question |
| `src/data/db/registry/clnt_column_registry.yml` | Data schema, codegen | Data schema or codegen task |
| `docs/prd/PRD.md` | Product requirements | PRD question or validation |
| `doctrine/OSAM.md` | Query routing, joins | Data query or join question |
| `SNAP_ON_TOOLBOX.yaml` | Tool evaluation | Tool selection or suggestion |

### TIER 3 — AUDIT (never auto-loaded)

| File | Trigger |
|------|---------|
| Parent `ARCHITECTURE.md` (full) | Constitutional audit or ambiguity in digest |
| Parent doctrine files (individual) | Specific domain audit (DBA, ERD, PRD, Process) |
| Parent claude prompts (individual) | Executing a specific ceremony |

---

## Binding Documents

This repository conforms to the following doctrine files from IMO-Creator:

| Document | Purpose | Location |
|----------|---------|----------|
| **ARCHITECTURE.md** (v2.1.0) | CTB Constitutional Law (CTB, CC, Hub-Spoke, IMO, Descent, OWN-10) | imo-creator/templates/doctrine/ |
| TEMPLATE_IMMUTABILITY.md | AI modification prohibition | imo-creator/templates/doctrine/ |
| ROLLBACK_PROTOCOL.md | Doctrine sync rollback procedure | imo-creator/templates/doctrine/ |
| SNAP_ON_TOOLBOX.yaml | Tool registry | imo-creator/templates/ |
| TOOLS.md | Tool doctrine | imo-creator/templates/integrations/ |
| OSAM.md (template) | Query routing contract (template) | imo-creator/templates/semantic/ |
| IMO_SYSTEM_SPEC.md | System index | imo-creator/templates/ |
| AI_EMPLOYEE_OPERATING_CONTRACT.md | Agent constraints | imo-creator/templates/ |

**Note**: ARCHITECTURE.md (v2.1.0) consolidates CANONICAL_ARCHITECTURE_DOCTRINE.md, HUB_SPOKE_ARCHITECTURE.md, and ALTITUDE_DESCENT_MODEL.md. Adds OWN-10a/10b/10c sub-hub table cardinality (ADR-001).

---

## Operational Files (This Repo)

| File | Purpose | Sync Rule |
|------|---------|-----------|
| `CC_OPERATIONAL_DIGEST.md` | TIER 1 operational rules digest | Always sync from parent |
| `STARTUP_PROTOCOL.md` | CC session startup sequence | Always sync from parent |
| `DOCTRINE_CHECKPOINT.yaml` | Plan-before-you-build gate | Sync if missing, fill per session |

---

## Doctrine Checkpoint Protocol

Before writing ANY code in this repo:

1. Read `CC_OPERATIONAL_DIGEST.md` (TIER 1 — the field manual)
2. Fill out `DOCTRINE_CHECKPOINT.yaml` with your plan
3. Only then write code and commit

The pre-commit hook rejects commits with missing or stale checkpoints.

---

## Domain-Specific Bindings

This repository's domain-specific bindings are declared in:

```
doctrine/REPO_DOMAIN_SPEC.md
doctrine/OSAM.md (v3.0.0 — customized for this hub)
```

OSAM maps generic roles to domain-specific tables and query routes.

---

## Authority Rule

> Parent doctrine is READ-ONLY.
> Domain specifics live in REPO_DOMAIN_SPEC.md and OSAM.md.
> If rules conflict, parent wins.

---

## Session Startup (MANDATORY)

Every session, before any work:
1. Run doctrine version check (see `STARTUP_PROTOCOL.md`)
2. Load Tier 1 files: `IMO_CONTROL.json`, `CC_OPERATIONAL_DIGEST.md`, `CLAUDE.md`
3. Verify `DOCTRINE_CHECKPOINT.yaml` is current
4. Begin work

If doctrine is stale, update first. If checkpoint is stale, fill it first.

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-02-15 |
| Status | ACTIVE |
