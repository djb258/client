# PRD — Hub

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 2.0.0 |
| **CTB Version** | 2.0.0 |
| **CC Layer** | CC-02 |

---

## 1. Sovereign Reference (CC-01)

| Field | Value |
|-------|-------|
| **Sovereign ID** | imo-creator |
| **Sovereign Boundary** | djb258/imo-creator |

---

## 2. Hub Identity (CC-02)

| Field | Value |
|-------|-------|
| **Hub Name** | Client Intake & Vendor Export System |
| **Hub ID** | client-subhive |
| **Owner** | Barton Ops System |
| **Version** | 2.0.0 |

---

## 3. Purpose & Transformation Declaration

This hub manages the intake of client data, transforms it into a canonical schema stored in Neon PostgreSQL, and exports to vendor-specific formats.

### Transformation Statement (REQUIRED)

| Field | Value |
|-------|-------|
| **Transformation Summary** | This system transforms **raw client intake data** (companies, employees, benefit elections, renewal quotes) into **canonical Neon records** and **vendor-specific export files**. |
| **Success Criteria** | Data validates against schema, stores canonically in `clnt` schema, exports successfully with audit trail. |

### Constants (Inputs)

| Constant | Source | Description |
|----------|--------|-------------|
| Company Data | API Intake Endpoint | Raw company information from intake process |
| Employee Data | API Intake Endpoint | Raw employee census and benefit selections |
| Renewal Quotes | Quote Intake | Carrier quotes for benefit renewal cycles |
| Vendor Blueprints | Configuration | Vendor-specific field mappings |
| Intake Schema | Zod Validation | Validation rules for intake data |

### Variables (Outputs)

| Variable | Destination | Description |
|----------|-------------|-------------|
| Canonical Client Identity | Neon `clnt.client_hub` + `clnt.client_master` | Normalized client identity and legal details |
| Canonical Employee Records | Neon `clnt.person` | Normalized employee/dependent data |
| Benefit Plans | Neon `clnt.plan` | Active plans with embedded rates |
| Plan Quotes | Neon `clnt.plan_quote` | Received carrier quotes for comparison |
| Benefit Elections | Neon `clnt.election` | Person-to-plan election records |
| Vendor Identity | Neon `clnt.vendor` + `clnt.external_identity_map` | Vendor records and ID translation |
| Service Requests | Neon `clnt.service_request` | Service ticket tracking |
| Compliance Flags | Neon `clnt.compliance_flag` | Compliance flag tracking |
| Audit Trail | Neon `clnt.audit_event` | Append-only system audit trail |

### Pass Structure

| Pass | Type | IMO Layer | Description |
|------|------|-----------|-------------|
| Intake Capture | CAPTURE | I (Ingress) | Collect data via API intake into staging tables |
| Validation & Normalization | COMPUTE | M (Middle) | Validate, transform, store in canonical `clnt` schema |
| Export Generation | GOVERN | O (Egress) | Generate vendor-specific outputs and compliance flags |

### Scope Boundary

| Scope | Description |
|-------|-------------|
| **IN SCOPE** | Client company intake, employee census intake, benefit election capture, renewal quote intake, quote-to-plan promotion, data validation, canonical storage, vendor identity mapping, service tracking, compliance flagging, audit logging |
| **OUT OF SCOPE** | Vendor API integrations (handled by separate hubs), payment processing, user authentication, email delivery |

---

## 4. CTB Placement

| Field | Value | CC Layer |
|-------|-------|----------|
| **Trunk** | ctb/ | CC-02 |
| **Branch** | sys/, data/, app/, ai/, ui/ | CC-02 |
| **Leaf** | Individual files within branches | CC-02 |

---

## 5. IMO Structure (CC-02)

| Layer | Role | Description | CC Layer |
|-------|------|-------------|----------|
| **I -- Ingress** | Dumb input only | API intake captures raw data into staging (S3: intake_batch, intake_record); no logic, no state | CC-02 |
| **M -- Middle** | Logic, decisions, state | Canonical `clnt` schema (S1-S2, S4-S7), validation, transformation, quote promotion logic | CC-02 |
| **O -- Egress** | Output only | Audit trail (S8: audit_event), compliance reports; no logic, no state | CC-02 |

---

## 6. Spokes (CC-03 Interfaces)

**Hub-Spoke Status**: IMPLEMENTED

| Spoke Name | Type | Direction | Licensed Capability | Contract | CC Layer |
|------------|------|-----------|---------------------|----------|----------|
| API Intake Endpoint | INGRESS | Inbound | Data capture | Zod validation schema | CC-03 |
| Vendor Export API | EGRESS | Outbound | Data export | vendor_output_blueprint schema | CC-03 |
| Compliance Report | EGRESS | Outbound | Compliance output | compliance_flag schema | CC-03 |

---

## 7. Constants vs Variables

| Element | Type | Mutability | CC Layer |
|---------|------|------------|----------|
| Hub ID | Constant | Immutable | CC-02 |
| Hub Name | Constant | ADR-gated | CC-02 |
| Canonical Schema (`clnt`) | Constant | ADR-gated | CC-02 |
| CTB Spoke Structure (S1-S8) | Constant | ADR-gated | CC-02 |
| Universal Join Key (`client_id`) | Constant | Immutable | CC-02 |
| Vendor Mappings | Variable | Configuration | CC-03 |
| Validation Rules | Variable | Configuration | CC-03 |
| Quote Status Lifecycle | Variable | Operational | CC-04 |

---

## 8. Tools

| Tool | Solution Type | CC Layer | IMO Layer | ADR Reference |
|------|---------------|----------|-----------|---------------|
| SHQ-INTAKE-VALIDATOR | Deterministic | CC-02 | M | ADR-001 |
| VENDOR-EXPORT-AGENT | Deterministic | CC-02 | M | ADR-001 |
| COMPLIANCE-CHECKER | Deterministic | CC-02 | M | ADR-001 |
| SUBAGENT-DELEGATOR | Rules-based | CC-02 | M | ADR-001 |
| REPO-MCP-ORCHESTRATOR | LLM-tail | CC-02 | M | ADR-001 |

---

## 9. Guard Rails

| Guard Rail | Type | Threshold | CC Layer |
|------------|------|-----------|----------|
| Intake Validation | Validation | All required fields present | CC-03 |
| Schema Compliance | Validation | All tables in `clnt` schema with client_id FK | CC-03 |
| Quote Status Enforcement | Validation | Status must be received/presented/selected/rejected | CC-04 |
| Promotion Integrity | Validation | Rates copied on promotion; plan is self-contained | CC-04 |

---

## 10. Kill Switch

| Field | Value |
|-------|-------|
| **Activation Criteria** | Critical data corruption detected, compliance violation |
| **Trigger Authority** | CC-02 (Hub) / CC-01 (Sovereign) |
| **Emergency Contact** | Hub Owner via AUDIT_MANIFEST_LLM.json |

---

## 11. Promotion Gates

| Gate | Artifact | CC Layer | Requirement |
|------|----------|----------|-------------|
| G1 | PRD | CC-02 | Hub definition approved |
| G2 | ADR | CC-03 | Architecture decision recorded |
| G3 | Work Item | CC-04 | Execution item created |
| G4 | PR | CC-04 | Code reviewed and merged |
| G5 | Checklist | CC-04 | Compliance verification complete |

---

## 12. Failure Modes

| Failure | Severity | CC Layer | Remediation |
|---------|----------|----------|-------------|
| Intake API fails | HIGH | CC-03 | Retry with exponential backoff |
| Neon promotion fails | CRITICAL | CC-02 | Roll back, log to audit_event |
| Vendor export malformed | HIGH | CC-03 | Validate against blueprint, retry |
| Audit log write fails | CRITICAL | CC-04 | Block all operations until resolved |
| Quote promotion conflict | HIGH | CC-04 | Validate one selected per benefit/cycle |

---

## 13. PID Scope (CC-04)

| Field | Value |
|-------|-------|
| **PID Pattern** | `client-subhive-${TIMESTAMP}-${RANDOM_HEX}` |
| **Retry Policy** | New PID per retry |
| **Audit Trail** | Required via clnt.audit_event |

---

## 14. Human Override Rules

Human override is permitted for:

- Emergency data corrections (CC-01 authority required)
- Compliance exemptions (CC-01 authority required, ADR mandatory)
- Kill switch activation (CC-02 or CC-01 authority)

All overrides MUST be logged to clnt.audit_event with human identifier.

---

## 15. Observability

| Type | Description | CC Layer |
|------|-------------|----------|
| **Logs** | clnt.audit_event (append-only) | CC-04 |
| **Metrics** | ERD_METRICS.yaml (daily sync from Neon) | CC-04 |
| **Alerts** | Critical errors via threshold breach in ERD_METRICS | CC-03/CC-04 |

---

## 16. Secrets Management

| Field | Value |
|-------|-------|
| **Provider** | Doppler (MANDATORY) |
| **Project** | barton-outreach-core (DB access), client-subhive (hub config) |
| **Documentation** | integrations/DOPPLER.md |

All runtime configuration MUST be sourced via Doppler. No .env files permitted.

---

## 17. UI Governance

UI implementations for this hub MUST follow:

| Document | Purpose |
|----------|---------|
| docs/ui/UI_CONSTITUTION.md | UI layer governance |
| docs/ui/UI_PRD_client-subhive.md | UI surface definitions |
| docs/ui/UI_ERD_client-subhive.md | Read-only data mirror |

**UI owns no schema, no persistence, no business logic.**

---

## Approval

| Role | Name | Date |
|------|------|------|
| Sovereign (CC-01) | imo-creator | 2026-01-30 |
| Hub Owner (CC-02) | Barton Ops System | 2026-02-11 |
| Reviewer | Pending | |

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Architecture Doctrine | ARCHITECTURE.md (v2.0.0) |
| Hub/Spoke Geometry | ARCHITECTURE.md Part IV |
| IMO Flow | ARCHITECTURE.md Part V |
| Descent Gates | ARCHITECTURE.md Part VI |
| Hub Design Declaration | HUB_DESIGN_DECLARATION.yaml |
| **Governing OSAM** | doctrine/OSAM.md |
| **OSAM Version** | 2.0.0 |
| **Governing ERD** | db/neon/migrations/SCHEMA_ER_DIAGRAM.md |
| **Governing Process** | docs/prd/PRD.md (Section 3: Pass Structure) |
| CTB Map | docs/CTB_MAP.md |
| CTB Governance | docs/CTB_GOVERNANCE.md |
| ADR-002 | docs/adr/ADR-002-ctb-consolidated-backbone.md |
| ADR-004 | docs/adr/ADR-004-renewal-downgraded-to-plan-support.md |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| Secrets Management | integrations/DOPPLER.md |
| Domain Bindings | doctrine/REPO_DOMAIN_SPEC.md |

## OSAM Compliance Declaration (MANDATORY)

| Check | Status |
|-------|--------|
| [x] Governing OSAM referenced above | doctrine/OSAM.md v2.0.0 |
| [x] All questions in this PRD can be answered via OSAM query routes | Verified |
| [x] No new query paths introduced in this PRD | Verified |
| [x] All required tables exist in OSAM | 13 tables declared |
