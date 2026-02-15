# OSAM — Semantic Access Map

**Status**: LOCKED
**Authority**: CONSTITUTIONAL
**Version**: 2.0.0
**Change Protocol**: ADR + HUMAN APPROVAL REQUIRED

---

## Purpose & Scope

The **Operational Semantic Access Map (OSAM)** is the authoritative query-routing contract for the Client Intake & Vendor Export System. It defines:

- **Where** data is queried from (query surfaces)
- **Which** tables own which concepts (semantic ownership)
- **Which** join paths are allowed (relationship contracts)
- **When** an agent MUST STOP and ask for clarification (halt conditions)

### What OSAM Is

| OSAM Is | OSAM Is NOT |
|---------|-------------|
| Authoritative query contract | Database schema |
| Semantic ownership map | Implementation guide |
| Join path declaration | Query optimization tool |
| Agent routing instructions | Business logic definition |

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
ERD (Structural Proof — WHAT tables implement OSAM contracts)
    |
    v
PROCESS (Execution Declaration — HOW transformation executes)
```

**OSAM sits ABOVE ERDs and DRIVES them.**
ERDs may only implement relationships that OSAM declares.

---

## Chain of Authority

### Parent -> Spine -> Spoke Hierarchy

```
client-subhive (CC-02)
    |
    v owns
    |
clnt.client_hub (Universal Join Key: client_id)
    |
    |--- S1 Hub ---------> [client_hub, client_master, client_projection]
    |--- S2 Plan --------> [plan, plan_quote]
    |--- S3 Intake ------> [intake_batch, intake_record]
    |--- S4 Vault -------> [person, election]
    |--- S5 Vendor ------> [vendor, external_identity_map]
    |--- S6 Service -----> [service_request]
    |--- S7 Compliance --> [compliance_flag]
    |--- S8 Audit -------> [audit_event]
```

### Authority Rules

| Rule | Description |
|------|-------------|
| Single Spine | client_hub is the ONE spine table |
| Universal Key | All spoke tables join to spine via client_id |
| No Cross-Spoke Direct Joins | Spoke tables must route through client_id; no lateral joins without it |
| Spine Owns Identity | client_hub is the authoritative source of client identity |

---

## Universal Join Key Declaration

```yaml
universal_join_key:
  name: "client_id"
  type: "UUID"
  source_table: "clnt.client_hub"
  description: "The single key that connects all tables in this hub"
```

### Join Key Rules

| Rule | Enforcement |
|------|-------------|
| Single Source | client_id is minted ONLY in client_hub |
| Immutable | Once assigned, a client_id cannot change (client_hub is FROZEN) |
| Propagated | All spoke tables receive client_id via FK relationship |
| Required | No table may exist without relationship to client_id |

---

## Query Routing Table

| Question Type | Authoritative Table | Join Path | Notes |
|---------------|---------------------|-----------|-------|
| Client identity | `client_hub` | Direct (spine) | Read-only after creation |
| Client legal/business details | `client_master` | `client_hub` -> `client_master` | 1:1 with spine |
| Benefit plan details | `plan` | `client_hub` -> `plan` | Canonical rates embedded |
| Plan quotes / renewal pricing | `plan_quote` | `client_hub` -> `plan_quote` | Support table, multiple per benefit/year |
| Quote-to-plan lineage | `plan` | `plan` -> `plan_quote` via `source_quote_id` | Nullable FK for promotion tracking |
| Raw enrollment staging | `intake_record` | `client_hub` -> `intake_batch` -> `intake_record` | Staging only, not query surface |
| Employee/dependent info | `person` | `client_hub` -> `person` | |
| Benefit elections | `election` | `client_hub` -> `person` -> `election` | Bridge table: person + plan |
| Vendor identity | `vendor` | `client_hub` -> `vendor` | |
| External ID translation | `external_identity_map` | `client_hub` -> `vendor` -> `external_identity_map` | |
| Service tickets | `service_request` | `client_hub` -> `service_request` | |
| Compliance flags | `compliance_flag` | `client_hub` -> `compliance_flag` | |
| Audit trail | `audit_event` | `client_hub` -> `audit_event` | Append-only, not business query surface |
| Client UI projection | `client_projection` | `client_hub` -> `client_projection` | SUPPORT table, 1:1 with spine (ADR-005) |
| Dashboard rendering | `v_client_dashboard` | View (hub + master + projection) | Read-only view for lovable.dev |

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
  spine_table: "clnt.client_hub"
  universal_join_key: "client_id"
  owns:
    - "S1: Hub"
    - "S2: Plan"
    - "S3: Intake"
    - "S4: Vault"
    - "S5: Vendor"
    - "S6: Service"
    - "S7: Compliance"
    - "S8: Audit"
```

### Spine Table

```yaml
spine_table:
  name: "clnt.client_hub"
  purpose: "Authoritative source of client identity (FROZEN after creation)"
  primary_key: "client_id"
  query_surface: true
  columns:
    - name: "client_id"
      type: "UUID"
      role: "Universal join key"
    - name: "created_at"
      type: "TIMESTAMPTZ"
      role: "Record creation timestamp"
    - name: "status"
      type: "TEXT"
      role: "Client lifecycle state"
    - name: "source"
      type: "TEXT"
      role: "Origin system identifier"
    - name: "version"
      type: "INT"
      role: "Record version counter"
```

### Spokes (Sub-Hubs)

```yaml
spokes:
  - name: "S1: Hub"
    cc_layer: CC-03
    purpose: "Root identity and legal details"
    joins_to_spine_via: "client_id"
    tables:
      - "client_hub"
      - "client_master"
      - "client_projection"

  - name: "S2: Plan"
    cc_layer: CC-03
    purpose: "Benefit plans and quote intake"
    joins_to_spine_via: "client_id"
    tables:
      - "plan"
      - "plan_quote"

  - name: "S3: Intake"
    cc_layer: CC-03
    purpose: "Enrollment staging (one-way)"
    joins_to_spine_via: "client_id"
    tables:
      - "intake_batch"
      - "intake_record"

  - name: "S4: Vault"
    cc_layer: CC-03
    purpose: "Employee identity and benefit elections"
    joins_to_spine_via: "client_id"
    tables:
      - "person"
      - "election"

  - name: "S5: Vendor"
    cc_layer: CC-03
    purpose: "Vendor identity and ID translation"
    joins_to_spine_via: "client_id"
    tables:
      - "vendor"
      - "external_identity_map"

  - name: "S6: Service"
    cc_layer: CC-03
    purpose: "Service ticket tracking"
    joins_to_spine_via: "client_id"
    tables:
      - "service_request"

  - name: "S7: Compliance"
    cc_layer: CC-03
    purpose: "Compliance flag tracking"
    joins_to_spine_via: "client_id"
    tables:
      - "compliance_flag"

  - name: "S8: Audit"
    cc_layer: CC-03
    purpose: "Append-only system audit trail"
    joins_to_spine_via: "client_id"
    tables:
      - "audit_event"
```

---

## Allowed Join Paths

### Declared Joins

Only joins declared in this section are permitted. All other joins are INVALID.

| From Table | To Table | Join Key | Direction | Purpose |
|------------|----------|----------|-----------|---------|
| `client_hub` | `client_master` | `client_id` | 1:1 | Hub identity to legal details |
| `client_hub` | `plan` | `client_id` | 1:N | Client owns benefit plans |
| `client_hub` | `plan_quote` | `client_id` | 1:N | Client receives quotes |
| `plan` | `plan_quote` | `source_quote_id = plan_quote_id` | N:1 | Plan promotion lineage |
| `client_hub` | `intake_batch` | `client_id` | 1:N | Client receives intake batches |
| `intake_batch` | `intake_record` | `intake_batch_id` | 1:N | Batch contains records |
| `client_hub` | `person` | `client_id` | 1:N | Client owns employees/dependents |
| `person` | `election` | `person_id` | 1:N | Person makes benefit elections |
| `plan` | `election` | `plan_id` | 1:N | Plan covers elections |
| `client_hub` | `vendor` | `client_id` | 1:N | Client contracts vendors |
| `vendor` | `external_identity_map` | `vendor_id` | 1:N | Vendor maps external IDs |
| `client_hub` | `service_request` | `client_id` | 1:N | Client has service requests |
| `client_hub` | `compliance_flag` | `client_id` | 1:N | Client has compliance flags |
| `client_hub` | `audit_event` | `client_id` | 1:N | Client has audit events |
| `client_hub` | `client_projection` | `client_id` | 1:1 | Client UI projection (ADR-005) |

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
| Intake tables | Vault tables (direct) | Intake -> Vault is one-way; staging data is never read back |
| Any table | intake_record (as query surface) | STAGING tables are not query surfaces |
| Any table | audit_event (as business query) | AUDIT tables are system logs, not business query surfaces |
| External identity map | Internal IDs (replacement) | External IDs must never replace internal UUIDs |

---

## Source / Enrichment Table Classification

### Table Classifications

| Classification | Query Surface | Description |
|----------------|---------------|-------------|
| **QUERY** | YES | Tables that answer business questions |
| **STAGING** | NO | Raw/staged data; not for direct query |
| **SUPPORT** | YES (limited) | Append-mostly support data; queryable for status |
| **AUDIT** | NO | System logging; not for business queries |

### Classification Table

| Table Name | Classification | Query Surface | Spoke | Notes |
|------------|----------------|---------------|-------|-------|
| `client_hub` | QUERY (FROZEN) | YES | S1 | Spine table — client identity |
| `client_master` | QUERY | YES | S1 | Legal/business details |
| `plan` | QUERY | YES | S2 | Canonical benefit plans with embedded rates |
| `plan_quote` | SUPPORT | YES | S2 | Quote intake; queryable for status tracking |
| `intake_batch` | STAGING | **NO** | S3 | Batch upload header |
| `intake_record` | STAGING | **NO** | S3 | Raw intake records |
| `person` | QUERY | YES | S4 | Employee/dependent identity |
| `election` | QUERY | YES | S4 | Benefit election bridge |
| `vendor` | QUERY | YES | S5 | Vendor identity |
| `external_identity_map` | QUERY | YES | S5 | Internal-to-external ID translation |
| `service_request` | QUERY | YES | S6 | Service ticket tracking |
| `compliance_flag` | QUERY | YES | S7 | Compliance flag tracking |
| `client_projection` | SUPPORT | YES (limited) | S1 | Per-client UI projection config (ADR-005) |
| `audit_event` | AUDIT | **NO** | S8 | System audit trail (append-only) |

### Classification Rules

| Rule | Enforcement |
|------|-------------|
| STAGING tables are NEVER query surfaces | Agent MUST HALT if asked to query STAGING |
| AUDIT tables are NEVER business query surfaces | Agent MUST HALT if asked for business data from audit |
| QUERY tables are the primary valid query surfaces | All business questions route to QUERY tables |
| SUPPORT tables are queryable for operational status | Quote tracking, status checks permitted |
| Misclassified queries are INVALID | Agent rejects and escalates |

---

## STOP Conditions

Agents MUST HALT and request clarification when:

### Query Routing STOP Conditions

| Condition | Action |
|-----------|--------|
| Question cannot be routed to a declared table | HALT -- ask human for routing |
| Question requires a join not declared in OSAM | HALT -- request ADR |
| Question targets a STAGING or AUDIT table as business surface | HALT -- classification violation |
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

Reason: [QUERY_UNROUTABLE | JOIN_UNDECLARED | STAGING_QUERY | AUDIT_QUERY | ISOLATION_VIOLATION | SEMANTIC_GAP | AMBIGUITY | STRUCTURAL]

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

---

## Validation Checklist

Before OSAM is considered valid:

| Check | Status |
|-------|--------|
| [x] Universal join key declared | client_id (UUID) |
| [x] Spine table identified | clnt.client_hub |
| [x] All spokes listed with table ownership | S1-S8 (8 spokes, 14 tables) |
| [x] All allowed joins explicitly declared | 15 joins declared |
| [x] All tables classified (QUERY/STAGING/SUPPORT/AUDIT) | 14 tables classified |
| [x] Query routing table complete | 15 question types routed |
| [x] STOP conditions understood | Query + Semantic conditions defined |
| [x] No undeclared joins exist in ERD | Verified against CTB_MAP.md |

---

## Relationship to Other Artifacts

| Artifact | OSAM Relationship |
|----------|-------------------|
| **PRD** | PRD declares WHAT transformation. OSAM declares WHERE to query. PRD must reference OSAM. |
| **ERD** | ERD implements OSAM. ERD may not introduce joins not in OSAM. |
| **CTB Map** | CTB_MAP.md documents the physical spoke structure that OSAM governs. |
| **Process** | Processes query via OSAM routes. No ad-hoc queries. |
| **Agents** | Agents follow OSAM routing strictly. HALT on unknown routes. |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-02-09 |
| Last Modified | 2026-02-15 |
| Version | 2.1.0 |
| Status | LOCKED |
| Authority | CONSTITUTIONAL |
| Derives From | CONSTITUTION.md (Transformation Law) |
| Change Protocol | ADR + HUMAN APPROVAL REQUIRED |
| ADR References | ADR-002, ADR-004, ADR-005 |
