# ADR: Foundational Architecture Decisions

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 1.0.0 |
| **CC Layer** | CC-03 |

---

## ADR Identity

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-001 |
| **Status** | [x] Accepted |
| **Date** | 2026-01-30 |

---

## Owning Hub (CC-02)

| Field | Value |
|-------|-------|
| **Sovereign ID** | imo-creator |
| **Hub Name** | Client Intake & Vendor Export System |
| **Hub ID** | client-subhive |

---

## CC Layer Scope

| Layer | Affected | Description |
|-------|----------|-------------|
| CC-01 (Sovereign) | [ ] | Not affected |
| CC-02 (Hub) | [x] | Hub structure and CTB placement |
| CC-03 (Context) | [x] | Spoke interfaces and guard rails |
| CC-04 (Process) | [x] | PID doctrine and audit trail |

---

## IMO Layer Scope

| Layer | Affected |
|-------|----------|
| I — Ingress | [x] |
| M — Middle | [x] |
| O — Egress | [x] |

---

## Constant vs Variable

| Classification | Value |
|----------------|-------|
| **This decision defines** | [x] Constant (structure/meaning) |
| **Mutability** | [x] ADR-gated |

---

## Context

This ADR records the foundational architectural decisions that were made during the initial build of the Client Intake & Vendor Export System. These decisions were already implemented; this ADR documents them for governance compliance.

The decisions address:
1. CTB (Christmas Tree Backbone) structure adoption
2. IMO (Ingress/Middle/Egress) data layer separation
3. Database technology selection
4. Secrets management approach
5. Agent altitude layering

---

## Decision

### Decision 1: CTB Structure

**Adopted:** 6-branch CTB structure under `/ctb/`

| Branch | Purpose |
|--------|---------|
| `sys/` | System infrastructure, scripts, tools |
| `data/` | Database schemas, migrations, queries |
| `ai/` | Agent configurations, HEIR packages |
| `ui/` | User interface, React components |
| `docs/` | Documentation, diagrams |
| `meta/` | Metadata, configurations, workflows |

**Why:** CTB provides deterministic file placement, eliminates "where does this go?" decisions, and enables automated compliance checking.

### Decision 2: IMO Table Naming

**Adopted:** All database tables follow IMO prefix convention:
- `clnt_i_*` — Ingress (input staging)
- `clnt_m_*` — Middle (canonical data)
- `clnt_o_*` — Egress (output/export)

**Why:** IMO naming makes data flow direction explicit in the schema itself. Auditors and agents can determine layer ownership by reading table names.

### Decision 3: Neon as Canonical Vault

**Adopted:** Neon (PostgreSQL) as the canonical data store for all Middle layer tables.

**Why:**
- PostgreSQL provides strong typing and constraints
- Neon offers serverless scaling
- Single source of truth for all canonical data
- Full audit trail via shq.audit_log

### Decision 4: API-Based Ingress

**Adopted:** REST API endpoints with Zod validation as the Ingress layer for data intake.

**Why:**
- Direct integration with Neon for data persistence
- Strong typing via Zod schemas
- Staging area before promotion to canonical tables
- No business logic in Ingress—validation only

### Decision 5: Doppler for Secrets

**Adopted:** Doppler as the only permitted secrets provider.

**Why:**
- Centralized secret management
- No .env files in repository
- Audit trail for secret access
- Environment-specific configurations

### Decision 6: HEIR Altitude Layers

**Adopted:** 4-layer agent altitude model:

| Altitude | Role | Examples |
|----------|------|----------|
| 30,000 ft | Strategic orchestration | SUBAGENT-DELEGATOR, REPO-MCP-ORCHESTRATOR |
| 20,000 ft | Tactical validation | SHQ-INTAKE-VALIDATOR, COMPLIANCE-CHECKER |
| 10,000 ft | Implementation | VENDOR-EXPORT-AGENT |
| 5,000 ft | Verification | Structure checks |

**Why:** Altitude layers provide clear separation of concerns and prevent lower-level agents from making strategic decisions.

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|----------------|
| Flat folder structure | No enforcement, ambiguous placement |
| MongoDB for Middle | Lacks strong typing, harder to audit |
| .env files for secrets | Security risk, no audit trail |
| Single agent for all tasks | Violates separation of concerns |
| Do Nothing | Would leave architecture undocumented |

---

## Consequences

### Enables

- Automated compliance checking via CTB registry
- Clear data lineage through IMO naming
- Deterministic file placement
- Agent coordination through altitude layers
- Secure secrets management

### Prevents

- Arbitrary folder creation
- Logic in Ingress or Egress layers
- Secrets in version control
- Agents operating outside their altitude

---

## PID Impact (if CC-04 affected)

| Field | Value |
|-------|-------|
| **New PID required** | [x] Yes |
| **PID pattern change** | [ ] No |
| **Audit trail impact** | All processes use `client-subhive-${TIMESTAMP}-${RANDOM_HEX}` pattern |

---

## Guard Rails

| Type | Value | CC Layer |
|------|-------|----------|
| Rate Limit | N/A | |
| Timeout | 30s for validation operations | CC-04 |
| Kill Switch | Hub owner can halt all operations | CC-02 |

---

## Rollback

These are foundational decisions. Rollback would require:
1. New ADR documenting the change
2. Human approval at CC-01 level
3. Migration plan for existing data
4. Update to all dependent documentation

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Canonical Doctrine | CANONICAL_ARCHITECTURE_DOCTRINE.md |
| Bootstrap Guide | CLAUDE.md |
| Hub Constitution | CONSTITUTION.md |
| Hub Doctrine | DOCTRINE.md |
| PRD | docs/prd/PRD.md |
| Domain Bindings | doctrine/REPO_DOMAIN_SPEC.md |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| Secrets Management | integrations/DOPPLER.md |
| Work Items | N/A (foundational) |
| PR(s) | ctb-compliance/constitutional-remediation |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Hub Owner (CC-02) | Barton Ops System | 2026-01-30 |
| Reviewer | Pending | |
