# OSAM — Semantic Access Map

**Status**: LOCKED
**Authority**: CONSTITUTIONAL
**Version**: 1.0.0
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

### Parent -> Spine -> Sub-Hub Hierarchy

```
client-subhive (CC-02)
    |
    v owns
    |
clnt2.clnt_m_client (Universal Join Key: client_id)
    |
    |---------------------------------------|---------------------------------------|
    v                                       v                                       v
intake (CC-03)                        canonical (CC-03)                        export (CC-03)
    |                                       |                                       |
    v                                       v                                       v
[clnt_i_raw_input]                    [clnt_m_person]                          [clnt_o_output]
[clnt_i_profile]                      [clnt_m_plan]                            [clnt_o_output_run]
                                      [clnt_m_plan_cost]                       [clnt_o_compliance]
                                      [clnt_m_election]
                                      [clnt_m_vendor_link]
                                      [clnt_m_spd]
```

### Authority Rules

| Rule | Description |
|------|-------------|
| Single Spine | clnt_m_client is the ONE spine table |
| Universal Key | All sub-hub tables join to spine via client_id |
| No Cross-Sub-Hub Joins | intake, canonical, and export tables may not join directly to each other |
| Spine Owns Identity | clnt_m_client is the authoritative source of client identity |

---

## Universal Join Key Declaration

```yaml
universal_join_key:
  name: "client_id"
  type: "UUID"
  source_table: "clnt2.clnt_m_client"
  description: "The single key that connects all tables in this hub"
```

### Join Key Rules

| Rule | Enforcement |
|------|-------------|
| Single Source | client_id is minted ONLY in clnt_m_client |
| Immutable | Once assigned, a client_id cannot change |
| Propagated | All sub-hub tables receive client_id via FK relationship |
| Required | No table may exist without relationship to client_id |

---

## Query Routing Table

| Question Type | Authoritative Table | Join Path | Notes |
|---------------|---------------------|-----------|-------|
| Client identity/info | `clnt_m_client` | Direct (spine) | |
| Employee/dependent info | `clnt_m_person` | `clnt_m_client` -> `clnt_m_person` | |
| Benefit plan details | `clnt_m_plan` | `clnt_m_client` -> `clnt_m_plan` | |
| Plan cost/pricing | `clnt_m_plan_cost` | `clnt_m_client` -> `clnt_m_plan` -> `clnt_m_plan_cost` | |
| Benefit elections | `clnt_m_election` | `clnt_m_client` -> `clnt_m_person` -> `clnt_m_election` | |
| Vendor associations | `clnt_m_vendor_link` | `clnt_m_client` -> `clnt_m_vendor_link` | |
| Summary plan descriptions | `clnt_m_spd` | `clnt_m_client` -> `clnt_m_plan` -> `clnt_m_spd` | |
| Export records | `clnt_o_output` | `clnt_m_client` -> `clnt_o_output` | |
| Export run history | `clnt_o_output_run` | `clnt_m_client` -> `clnt_o_output` -> `clnt_o_output_run` | |
| Compliance status | `clnt_o_compliance` | `clnt_m_client` -> `clnt_o_compliance` | |

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
  spine_table: "clnt2.clnt_m_client"
  universal_join_key: "client_id"
  owns:
    - "intake"
    - "canonical"
    - "export"
```

### Spine Table

```yaml
spine_table:
  name: "clnt2.clnt_m_client"
  purpose: "Authoritative source of client identity"
  primary_key: "client_id"
  query_surface: true
  columns:
    - name: "client_id"
      type: "UUID"
      role: "Universal join key"
    - name: "company_name"
      type: "VARCHAR"
      role: "Client company name"
    - name: "status"
      type: "VARCHAR"
      role: "Client lifecycle state"
    - name: "created_at"
      type: "TIMESTAMP"
      role: "Record creation timestamp"
```

### Sub-Hubs

```yaml
sub_hubs:
  - name: "intake"
    cc_layer: CC-03
    purpose: "Raw data staging from API intake"
    joins_to_spine_via: "client_id"
    tables:
      - "clnt_i_raw_input"
      - "clnt_i_profile"

  - name: "canonical"
    cc_layer: CC-03
    purpose: "Canonical business data and benefit administration"
    joins_to_spine_via: "client_id"
    tables:
      - "clnt_m_person"
      - "clnt_m_plan"
      - "clnt_m_plan_cost"
      - "clnt_m_election"
      - "clnt_m_vendor_link"
      - "clnt_m_spd"

  - name: "export"
    cc_layer: CC-03
    purpose: "Vendor export generation and compliance reporting"
    joins_to_spine_via: "client_id"
    tables:
      - "clnt_o_output"
      - "clnt_o_output_run"
      - "clnt_o_compliance"
```

---

## Allowed Join Paths

### Declared Joins

Only joins declared in this section are permitted. All other joins are INVALID.

| From Table | To Table | Join Key | Direction | Purpose |
|------------|----------|----------|-----------|---------|
| `clnt_m_client` | `clnt_m_person` | `client_id` | 1:N | Client owns employees/dependents |
| `clnt_m_client` | `clnt_m_plan` | `client_id` | 1:N | Client owns benefit plans |
| `clnt_m_client` | `clnt_m_vendor_link` | `client_id` | 1:N | Client linked to vendors |
| `clnt_m_client` | `clnt_o_output` | `client_id` | 1:N | Client has export records |
| `clnt_m_client` | `clnt_o_compliance` | `client_id` | 1:N | Client has compliance records |
| `clnt_m_client` | `clnt_i_raw_input` | `client_id` | 1:N | Client has raw intake records |
| `clnt_m_client` | `clnt_i_profile` | `client_id` | 1:N | Client has source profiles |
| `clnt_m_person` | `clnt_m_election` | `person_id` | 1:N | Person makes benefit elections |
| `clnt_m_plan` | `clnt_m_plan_cost` | `plan_id` | 1:N | Plan has cost tiers |
| `clnt_m_plan` | `clnt_m_spd` | `plan_id` | 1:N | Plan has summary descriptions |
| `clnt_o_output` | `clnt_o_output_run` | `output_id` | 1:N | Output has execution runs |

### Join Rules

| Rule | Enforcement |
|------|-------------|
| Declared Only | If a join is not in this table, it is INVALID |
| No Ad-Hoc Joins | Agents may not invent joins at runtime |
| ERD Must Implement | ERDs may only contain joins declared here |
| ADR for New Joins | Adding a new join requires ADR approval |

### Forbidden Joins

| From | To | Reason |
|------|----|--------|
| intake tables | export tables (direct) | Cross-sub-hub isolation |
| intake tables | canonical tables (direct) | Cross-sub-hub isolation; must route through spine |
| canonical tables | export tables (direct) | Cross-sub-hub isolation; must route through spine |
| Any table | clnt_i_raw_input (as query surface) | SOURCE tables are not query surfaces |
| Any table | clnt_i_profile (as query surface) | SOURCE tables are not query surfaces |

---

## Source / Enrichment Table Classification

### Table Classifications

| Classification | Query Surface | Description |
|----------------|---------------|-------------|
| **QUERY** | YES | Tables that answer questions |
| **SOURCE** | NO | Raw ingested data; not for direct query |
| **ENRICHMENT** | NO | Lookup/reference data; joined for enrichment only |
| **AUDIT** | NO | Logging/tracking; not for business queries |

### Classification Table

| Table Name | Classification | Query Surface | Notes |
|------------|----------------|---------------|-------|
| `clnt_m_client` | QUERY | YES | Spine table - client identity |
| `clnt_m_person` | QUERY | YES | Employee/dependent records |
| `clnt_m_plan` | QUERY | YES | Benefit plan definitions |
| `clnt_m_plan_cost` | QUERY | YES | Plan cost structures |
| `clnt_m_election` | QUERY | YES | Benefit elections |
| `clnt_m_vendor_link` | QUERY | YES | Vendor associations |
| `clnt_m_spd` | QUERY | YES | Summary plan descriptions |
| `clnt_o_output` | QUERY | YES | Vendor export records |
| `clnt_o_output_run` | QUERY | YES | Export execution history |
| `clnt_o_compliance` | QUERY | YES | Compliance reports |
| `clnt_i_raw_input` | SOURCE | **NO** | Raw intake staging data |
| `clnt_i_profile` | SOURCE | **NO** | Source system profiles |

### Classification Rules

| Rule | Enforcement |
|------|-------------|
| SOURCE tables are NEVER query surfaces | Agent MUST HALT if asked to query SOURCE |
| ENRICHMENT tables are joined, not queried | Never the "FROM" table |
| QUERY tables are the only valid query surfaces | All questions route to QUERY tables |
| Misclassified queries are INVALID | Agent rejects and escalates |

---

## STOP Conditions

Agents MUST HALT and request clarification when:

### Query Routing STOP Conditions

| Condition | Action |
|-----------|--------|
| Question cannot be routed to a declared table | HALT -- ask human for routing |
| Question requires a join not declared in OSAM | HALT -- request ADR |
| Question targets a SOURCE or ENRICHMENT table | HALT -- query surfaces only |
| Question requires cross-sub-hub direct join | HALT -- isolation violation |

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

Reason: [QUERY_UNROUTABLE | JOIN_UNDECLARED | SOURCE_QUERY | ISOLATION_VIOLATION | SEMANTIC_GAP | AMBIGUITY | STRUCTURAL]

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
| 1.0.0 | 2026-02-09 | Claude Code | Initial OSAM declaration for client-subhive |

---

## Validation Checklist

Before OSAM is considered valid:

| Check | Status |
|-------|--------|
| [x] Universal join key declared | client_id (UUID) |
| [x] Spine table identified | clnt2.clnt_m_client |
| [x] All sub-hubs listed with table ownership | intake, canonical, export |
| [x] All allowed joins explicitly declared | 11 joins declared |
| [x] All tables classified (QUERY/SOURCE/ENRICHMENT/AUDIT) | 12 tables classified |
| [x] Query routing table complete | 10 question types routed |
| [x] STOP conditions understood | Query + Semantic conditions defined |
| [x] No undeclared joins exist in ERD | Verified against schema |

---

## Relationship to Other Artifacts

| Artifact | OSAM Relationship |
|----------|-------------------|
| **PRD** | PRD declares WHAT transformation. OSAM declares WHERE to query. PRD must reference OSAM. |
| **ERD** | ERD implements OSAM. ERD may not introduce joins not in OSAM. |
| **Process** | Processes query via OSAM routes. No ad-hoc queries. |
| **Agents** | Agents follow OSAM routing strictly. HALT on unknown routes. |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-02-09 |
| Last Modified | 2026-02-09 |
| Version | 1.0.0 |
| Status | LOCKED |
| Authority | CONSTITUTIONAL |
| Derives From | CONSTITUTION.md (Transformation Law) |
| Change Protocol | ADR + HUMAN APPROVAL REQUIRED |
