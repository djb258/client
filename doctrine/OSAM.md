# OSAM — Semantic Access Map

**Status**: LOCKED
**Authority**: CONSTITUTIONAL
**Version**: 3.0.0
**Change Protocol**: ADR + HUMAN APPROVAL REQUIRED

---

## Purpose & Scope

The **Operational Semantic Access Map (OSAM)** is the authoritative query-routing contract for the Client Intake & Vendor Export System. It defines:

- **Where** data is queried from (query surfaces)
- **Which** tables own which concepts (semantic ownership)
- **Which** join paths are allowed (relationship contracts)
- **When** an agent MUST STOP and ask for clarification (halt conditions)
- **Where** schema artifacts live (single source of truth)

### What OSAM Is

| OSAM Is | OSAM Is NOT |
|---------|-------------|
| Authoritative query contract | Database schema |
| Semantic ownership map | Implementation guide |
| Join path declaration | Query optimization tool |
| Agent routing instructions | Business logic definition |
| Schema artifact index | Code repository |

### Hierarchical Position

```
CONSTITUTION.md (Transformation Law)
    |
    v
PRD (Behavioral Proof — WHAT transformation occurs)
    |
    v
OSAM (Semantic Access Map — WHERE to query, HOW to join) <-- THIS DOCUMENT
    |
    v
Column Registry (SINGLE SOURCE OF TRUTH — schema definition)
    |
    v
Generated Artifacts (types.ts, schema.ts, ERD.md, index.ts)
    |
    v
PROCESS (Execution Declaration — HOW transformation executes)
```

**OSAM sits ABOVE the Column Registry and DRIVES it.**
The Column Registry implements what OSAM declares.
Generated artifacts are projections of the registry — never hand-edited.

---

## Schema Artifacts — Start Here

**AI agents and developers: read these files in this order.**

| # | Artifact | Path | Purpose | Hand-Edit? |
|---|----------|------|---------|------------|
| 1 | **This document (OSAM)** | `doctrine/OSAM.md` | Routing contract, join rules, halt conditions | YES |
| 2 | **Column Registry** | `src/data/db/registry/clnt_column_registry.yml` | SINGLE SOURCE OF TRUTH — every table, column, FK, constraint | YES |
| 3 | **ERD** | `src/data/ERD.md` | Visual relationship diagram + column ID index | NO (generated) |
| 4 | **Barrel Index** | `src/data/spokes/index.ts` | Single TypeScript import for all types and schemas | NO (generated) |
| 5 | **Spoke types.ts** | `src/data/spokes/{spoke}/types.ts` | TypeScript interfaces per spoke | NO (generated) |
| 6 | **Spoke schema.ts** | `src/data/spokes/{spoke}/schema.ts` | Zod write schemas per spoke | NO (generated) |
| 7 | **Spoke README.md** | `src/data/spokes/{spoke}/README.md` | Spoke governance contract | YES |
| 8 | **Hub Accessor** | `src/data/hub/accessor.ts` | Read-only query helpers (zero mutations) | YES |

### Regeneration Command

```bash
npx ts-node scripts/codegen-schema.ts
```

This reads the column registry and regenerates all files marked "NO (generated)" above.

### The Golden Rule

> **If it can be derived, it MUST be derived. Only hand-write what requires human judgment.**

---

## Enforcement Gates

Two gates protect registry-first integrity. Both are runnable as pre-commit hooks or CI steps.

### Gate 1: Codegen Verification (`codegen:verify`)

**Purpose**: Detects drift between the column registry and the generated files on disk.

**How it works**: Regenerates all files in-memory from `clnt_column_registry.yml`, compares the output byte-for-byte against the actual files in `src/data/spokes/` and `src/data/`. If any file differs, it exits non-zero and reports which files are out of sync.

```bash
# Run manually
npm run codegen:verify

# Direct invocation
npx tsx scripts/verify-codegen.ts
```

**Exit codes**:
| Code | Meaning |
|------|---------|
| 0 | All generated files match the registry |
| 1 | One or more files are out of sync (drift detected) |
| 2 | Registry load or generation error |

**When to run**: After any registry change, before committing, in CI.

### Gate 2: Generated Folder Protection (`codegen:guard`)

**Purpose**: Rejects commits that modify generated files without also modifying the column registry. Prevents manual edits that will be silently overwritten on the next codegen run.

**How it works**: Inspects `git diff --cached` for staged generated files. If generated files are staged but `clnt_column_registry.yml` is not, the commit is rejected.

```bash
# Run manually
npm run codegen:guard

# Direct invocation
bash scripts/guard-generated.sh
```

**Protected paths** (from `.gitattributes`):
- `src/data/spokes/*/types.ts`
- `src/data/spokes/*/schema.ts`
- `src/data/spokes/index.ts`
- `src/data/ERD.md`

**When to run**: As a pre-commit hook or CI step.

### Pre-Commit Hook Setup

To activate both gates as a pre-commit hook:

```bash
cat > .git/hooks/pre-commit << 'HOOK'
#!/usr/bin/env bash
set -e
bash scripts/guard-generated.sh
npx tsx scripts/verify-codegen.ts
HOOK
chmod +x .git/hooks/pre-commit
```

### Correct Workflow

```
1. Edit clnt_column_registry.yml          (the ONE source of truth)
2. Run:  npm run codegen                  (regenerate all files)
3. Run:  npm run codegen:verify           (confirm zero drift)
4. Stage: git add registry + generated    (both together)
5. Commit passes codegen:guard            (registry present → allowed)
```

---

## Chain of Authority

### Parent -> Spine -> Spoke Hierarchy

```
client-subhive (CC-02)
    |
    v owns
    |
clnt.client (Universal Join Key: client_id)
    |
    |--- S1 Hub ---------> [client, client_error]
    |--- S2 Plan --------> [plan, plan_error, plan_quote]
    |--- S3 Employee -----> [person, employee_error, election, enrollment_intake, intake_record]
    |--- S4 Vendor -------> [vendor, vendor_error, external_identity_map, invoice]
    |--- S5 Service ------> [service_request, service_error]
```

### CTB Doctrine Compliance

Each spoke follows OWN-10a/OWN-10b:

| Spoke | CANONICAL (1) | ERROR (1) | Additional (ADR-justified) |
|-------|---------------|-----------|---------------------------|
| S1 Hub | client | client_error | — |
| S2 Plan | plan | plan_error | plan_quote (SUPPORT) |
| S3 Employee | person | employee_error | election (SUPPORT), enrollment_intake (STAGING), intake_record (STAGING) |
| S4 Vendor | vendor | vendor_error | external_identity_map (SUPPORT), invoice (SUPPORT) |
| S5 Service | service_request | service_error | — |

### Authority Rules

| Rule | Description |
|------|-------------|
| Single Spine | `client` is the ONE spine table (merged hub + master + projection) |
| Universal Key | All spoke tables join to spine via client_id |
| No Cross-Spoke Direct Joins | Spoke tables must route through client_id; no lateral joins without it |
| Spine Owns Identity | `client` is the authoritative source of client identity |
| 1 CANONICAL + 1 ERROR per spoke | Per OWN-10a, OWN-10b |

---

## Universal Join Key Declaration

```yaml
universal_join_key:
  name: "client_id"
  type: "UUID"
  source_table: "clnt.client"
  description: "The single key that connects all tables in this hub"
```

### Join Key Rules

| Rule | Enforcement |
|------|-------------|
| Single Source | client_id is minted ONLY in `clnt.client` |
| Immutable | Once assigned, a client_id cannot change |
| Propagated | All spoke tables receive client_id via FK relationship |
| Required | No table may exist without relationship to client_id |

---

## Query Routing Table

| Question Type | Authoritative Table | Join Path | Notes |
|---------------|---------------------|-----------|-------|
| Client identity | `client` | Direct (spine) | Sovereign identity |
| Client legal/business details | `client` | Direct (spine) | Merged from former client_master |
| Client UI projection | `client` | Direct (spine) | Merged from former client_projection |
| Benefit plan details | `plan` | `client` -> `plan` | Canonical rates embedded |
| Plan quotes / renewal pricing | `plan_quote` | `client` -> `plan_quote` | Support table, multiple per benefit/year |
| Quote-to-plan lineage | `plan` | `plan` -> `plan_quote` via `source_quote_id` | Nullable FK for promotion tracking |
| Enrollment batch status | `enrollment_intake` | `client` -> `enrollment_intake` | Staging — limited query surface |
| Raw enrollment records | `intake_record` | `client` -> `enrollment_intake` -> `intake_record` | Staging, immutable |
| Employee/dependent info | `person` | `client` -> `person` | Promoted from enrollment_intake |
| Benefit elections | `election` | `client` -> `person` -> `election` | Bridge: person + plan |
| Vendor identity | `vendor` | `client` -> `vendor` | |
| External ID translation | `external_identity_map` | `client` -> `vendor` -> `external_identity_map` | |
| Vendor invoices / billing | `invoice` | `client` -> `vendor` -> `invoice` | |
| Service tickets | `service_request` | `client` -> `service_request` | |
| Dashboard rendering | `v_client_dashboard` | View (client table) | Read-only view |
| Client-level errors | `client_error` | `client` -> `client_error` | ERROR table |
| Plan-level errors | `plan_error` | `client` -> `plan_error` | ERROR table |
| Employee-level errors | `employee_error` | `client` -> `employee_error` | ERROR table |
| Vendor-level errors | `vendor_error` | `client` -> `vendor_error` | ERROR table |
| Service-level errors | `service_error` | `client` -> `service_error` | ERROR table |

### Routing Rules

| Rule | Description |
|------|-------------|
| One Table Per Question | Each question type has exactly ONE authoritative table |
| Explicit Paths Only | Only declared join paths may be used |
| No Discovery | Agents may not discover new query paths at runtime |
| HALT on Unknown | If a question cannot be routed, agent MUST HALT |

---

## Hub Definitions

### Parent Hub

```yaml
parent_hub:
  name: "client-subhive"
  cc_layer: CC-02
  spine_table: "clnt.client"
  universal_join_key: "client_id"
  owns:
    - "S1: Hub"
    - "S2: Plan"
    - "S3: Employee"
    - "S4: Vendor"
    - "S5: Service"
```

### Spine Table

```yaml
spine_table:
  name: "clnt.client"
  purpose: "Canonical client record — sovereign identity + business details + UI projection"
  primary_key: "client_id"
  query_surface: true
  note: "Merges former client_hub + client_master + client_projection"
```

### Spokes (Sub-Hubs)

```yaml
spokes:
  - name: "S1: Hub"
    cc_layer: CC-03
    purpose: "Client identity and configuration"
    joins_to_spine_via: "client_id"
    canonical: "client"
    error: "client_error"
    tables:
      - "client"
      - "client_error"

  - name: "S2: Plan"
    cc_layer: CC-03
    purpose: "Benefit plans and quote intake"
    joins_to_spine_via: "client_id"
    canonical: "plan"
    error: "plan_error"
    tables:
      - "plan"
      - "plan_error"
      - "plan_quote"

  - name: "S3: Employee"
    cc_layer: CC-03
    purpose: "Enrollment and employee identity"
    joins_to_spine_via: "client_id"
    canonical: "person"
    error: "employee_error"
    tables:
      - "person"
      - "employee_error"
      - "election"
      - "enrollment_intake"
      - "intake_record"

  - name: "S4: Vendor"
    cc_layer: CC-03
    purpose: "Vendor identity and billing"
    joins_to_spine_via: "client_id"
    canonical: "vendor"
    error: "vendor_error"
    tables:
      - "vendor"
      - "vendor_error"
      - "external_identity_map"
      - "invoice"

  - name: "S5: Service"
    cc_layer: CC-03
    purpose: "Service ticket tracking and dashboards"
    joins_to_spine_via: "client_id"
    canonical: "service_request"
    error: "service_error"
    tables:
      - "service_request"
      - "service_error"
```

---

## Allowed Join Paths

### Declared Joins

Only joins declared in this section are permitted. All other joins are INVALID.

| From Table | To Table | Join Key | Direction | Purpose |
|------------|----------|----------|-----------|---------|
| `client` | `plan` | `client_id` | 1:N | Client owns benefit plans |
| `client` | `plan_quote` | `client_id` | 1:N | Client receives quotes |
| `plan` | `plan_quote` | `source_quote_id = plan_quote_id` | N:1 | Plan promotion lineage |
| `client` | `enrollment_intake` | `client_id` | 1:N | Client receives enrollment batches |
| `enrollment_intake` | `intake_record` | `enrollment_intake_id` | 1:N | Batch contains records |
| `client` | `person` | `client_id` | 1:N | Client owns employees/dependents |
| `person` | `election` | `person_id` | 1:N | Person makes benefit elections |
| `plan` | `election` | `plan_id` | 1:N | Plan covers elections |
| `client` | `vendor` | `client_id` | 1:N | Client contracts vendors |
| `vendor` | `external_identity_map` | `vendor_id` | 1:N | Vendor maps external IDs |
| `vendor` | `invoice` | `vendor_id` | 1:N | Vendor issues invoices |
| `client` | `service_request` | `client_id` | 1:N | Client has service requests |
| `client` | `client_error` | `client_id` | 1:N | Client error log |
| `client` | `plan_error` | `client_id` | 1:N | Plan error log |
| `client` | `employee_error` | `client_id` | 1:N | Employee error log |
| `client` | `vendor_error` | `client_id` | 1:N | Vendor error log |
| `client` | `service_error` | `client_id` | 1:N | Service error log |

### Join Rules

| Rule | Enforcement |
|------|-------------|
| Declared Only | If a join is not in this table, it is INVALID |
| No Ad-Hoc Joins | Agents may not invent joins at runtime |
| ERD Must Implement | ERDs may only contain joins declared here |
| ADR for New Joins | Adding a new join requires ADR approval |
| All Joins Include client_id | No lateral spoke joins without client_id in the path |

### Forbidden Joins

| From | To | Reason |
|------|----|--------|
| Intake tables | Person (direct bypass) | Enrollment data must go through validation before promotion |
| Any table | intake_record (as business query) | STAGING tables are not business query surfaces |
| External identity map | Internal IDs (replacement) | External IDs must never replace internal UUIDs |
| Any table | error tables (as business query) | ERROR tables are operational logs, not business surfaces |

---

## Table Classification

### Classification Types

| Classification | Query Surface | Leaf Type | Description |
|----------------|---------------|-----------|-------------|
| **CANONICAL** | YES | CANONICAL | One per spoke. Core data tables. |
| **SUPPORT** | YES (limited) | SUPPORT | Additional tables. Queryable for status. |
| **STAGING** | Limited | STAGING | Temporary/intake data. Not primary query surface. |
| **ERROR** | Operational | ERROR | One per spoke. Processing error logs. |

### Full Classification Table

| Table Name | Classification | Query Surface | Spoke | Leaf Type |
|------------|----------------|---------------|-------|-----------|
| `client` | CANONICAL | YES | S1 | CANONICAL |
| `client_error` | ERROR | Operational | S1 | ERROR |
| `plan` | CANONICAL | YES | S2 | CANONICAL |
| `plan_error` | ERROR | Operational | S2 | ERROR |
| `plan_quote` | SUPPORT | YES (limited) | S2 | SUPPORT |
| `person` | CANONICAL | YES | S3 | CANONICAL |
| `employee_error` | ERROR | Operational | S3 | ERROR |
| `election` | SUPPORT | YES | S3 | SUPPORT |
| `enrollment_intake` | STAGING | Limited | S3 | STAGING |
| `intake_record` | STAGING | **NO** | S3 | STAGING |
| `vendor` | CANONICAL | YES | S4 | CANONICAL |
| `vendor_error` | ERROR | Operational | S4 | ERROR |
| `external_identity_map` | SUPPORT | YES | S4 | SUPPORT |
| `invoice` | SUPPORT | YES | S4 | SUPPORT |
| `service_request` | CANONICAL | YES | S5 | CANONICAL |
| `service_error` | ERROR | Operational | S5 | ERROR |

### Classification Rules

| Rule | Enforcement |
|------|-------------|
| STAGING tables are NOT primary query surfaces | Agent MUST HALT if asked for business data from STAGING |
| ERROR tables are operational logs | Queryable for error tracking, not business questions |
| CANONICAL tables are the primary query surfaces | All business questions route to CANONICAL tables |
| SUPPORT tables are queryable for operational status | Quote tracking, election lookup, invoice status permitted |
| Misclassified queries are INVALID | Agent rejects and escalates |

---

## STOP Conditions

Agents MUST HALT and request clarification when:

### Query Routing STOP Conditions

| Condition | Action |
|-----------|--------|
| Question cannot be routed to a declared table | HALT -- ask human for routing |
| Question requires a join not declared in OSAM | HALT -- request ADR |
| Question targets a STAGING table as business surface | HALT -- classification violation |
| Question requires cross-spoke direct join without client_id | HALT -- isolation violation |

### Semantic STOP Conditions

| Condition | Action |
|-----------|--------|
| Concept not declared in OSAM | HALT -- semantic gap |
| Multiple tables claim ownership of concept | HALT -- ambiguity resolution required |
| Universal join key not found in query path | HALT -- structural violation |

### STOP Output Format

```
OSAM HALT
=============================================================================

Reason: [QUERY_UNROUTABLE | JOIN_UNDECLARED | STAGING_QUERY | ISOLATION_VIOLATION | SEMANTIC_GAP | AMBIGUITY | STRUCTURAL]

Question: "<THE_QUESTION_ASKED>"
Attempted Route: [What the agent tried to do]
OSAM Reference: [Section that applies]

Resolution Required:
  [ ] Human must declare new routing
  [ ] ADR required for new join
  [ ] Clarify which table owns this concept

Agent is HALTED. Awaiting resolution.
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-09 | Claude Code | Initial OSAM declaration (clnt2 schema) |
| 2.0.0 | 2026-02-11 | Claude Code | Complete rewrite for clnt CTB backbone (ADR-002, ADR-004) |
| 2.1.0 | 2026-02-15 | Claude Code | Add client_projection (S1 SUPPORT) + v_client_dashboard view (ADR-005) |
| 3.0.0 | 2026-02-15 | Claude Code | Major restructure: 5 spokes (S1-S5), CTB OWN-10 compliance (1 CANONICAL + 1 ERROR per spoke), merged client table, added invoice, schema artifacts section, registry-first codegen (ADR-006) |

---

## Validation Checklist

Before OSAM is considered valid:

| Check | Status |
|-------|--------|
| [x] Universal join key declared | client_id (UUID) |
| [x] Spine table identified | clnt.client |
| [x] All spokes listed with table ownership | S1-S5 (5 spokes, 16 tables) |
| [x] All allowed joins explicitly declared | 17 joins declared |
| [x] All tables classified (CANONICAL/SUPPORT/STAGING/ERROR) | 16 tables classified |
| [x] Query routing table complete | 20 question types routed |
| [x] STOP conditions understood | Query + Semantic conditions defined |
| [x] Schema artifacts indexed | Registry, ERD, codegen documented |
| [x] CTB OWN-10 compliance | 1 CANONICAL + 1 ERROR per spoke verified |

---

## Relationship to Other Artifacts

| Artifact | OSAM Relationship |
|----------|-------------------|
| **PRD** | PRD declares WHAT transformation. OSAM declares WHERE to query. |
| **Column Registry** | Registry implements OSAM's table declarations. OSAM drives the registry. |
| **ERD** | ERD is generated from the registry. ERD may not introduce joins not in OSAM. |
| **Codegen** | `scripts/codegen-schema.ts` reads registry, generates TypeScript projections. |
| **Hub Accessor** | Read-only query helpers that follow OSAM routing. Zero mutations. |
| **Process** | Processes query via OSAM routes. No ad-hoc queries. |
| **Agents** | Agents follow OSAM routing strictly. HALT on unknown routes. |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-02-09 |
| Last Modified | 2026-02-15 |
| Version | 3.0.0 |
| Status | LOCKED |
| Authority | CONSTITUTIONAL |
| Derives From | CONSTITUTION.md (Transformation Law) |
| Change Protocol | ADR + HUMAN APPROVAL REQUIRED |
| ADR References | ADR-002, ADR-004, ADR-005, ADR-006 |
