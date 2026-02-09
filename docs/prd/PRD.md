# PRD — Hub

## Conformance

| Field | Value |
|-------|-------|
| **Doctrine Version** | 1.0.0 |
| **CTB Version** | 1.0.0 |
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
| **Version** | 1.0.0 |

---

## 3. Purpose & Transformation Declaration

This hub manages the intake of client data through a wizard interface, transforms it into a canonical schema, and exports it to vendor-specific formats.

### Transformation Statement (REQUIRED)

| Field | Value |
|-------|-------|
| **Transformation Summary** | This system transforms **raw client intake data** (companies, employees, benefit elections) into **canonical Neon records** and **vendor-specific export files**. |

### Constants (Inputs)

| Constant | Source | Description |
|----------|--------|-------------|
| Company Data | API Intake Endpoint | Raw company information from intake process |
| Employee Data | API Intake Endpoint | Raw employee census and benefit selections |
| Vendor Blueprints | Configuration | Vendor-specific field mappings |
| Intake Schema | Zod Validation | Validation rules for intake data |

### Variables (Outputs)

| Variable | Destination | Description |
|----------|-------------|-------------|
| Canonical Company Records | Neon `clnt.company_master` | Normalized company data |
| Canonical Employee Records | Neon `clnt.employee_master` | Normalized employee data |
| Benefit Elections | Neon `clnt.employee_benefit_enrollment` | Election records |
| Vendor Export Files | Neon `clnt.vendor_output_blueprint` | Vendor-formatted exports |
| Audit Trail | Neon `shq.audit_log` | All agent actions logged |

### Pass Structure

| Pass | Type | IMO Layer | Description |
|------|------|-----------|-------------|
| Intake Capture | CAPTURE | I (Ingress) | Collect data via API intake |
| Validation & Normalization | COMPUTE | M (Middle) | Validate, transform, store in Neon |
| Export Generation | GOVERN | O (Egress) | Generate vendor-specific outputs |

### Scope Boundary

| Scope | Description |
|-------|-------------|
| **IN SCOPE** | Client company intake, employee census intake, benefit election capture, data validation, canonical storage, vendor export generation, audit logging |
| **OUT OF SCOPE** | Vendor API integrations (handled by separate hubs), payment processing, user authentication, email delivery |

---

## 4. CTB Placement

| Field | Value | CC Layer |
|-------|-------|----------|
| **Trunk** | ctb/ | CC-02 |
| **Branch** | sys/, data/, ai/, ui/, docs/, meta/ | CC-02 |
| **Leaf** | Individual files within branches | CC-02 |

---

## 5. IMO Structure (CC-02)

| Layer | Role | Description | CC Layer |
|-------|------|-------------|----------|
| **I — Ingress** | Dumb input only | API intake captures raw data; no logic, no state | CC-02 |
| **M — Middle** | Logic, decisions, state | Neon canonical schema, validation agents, transformation logic | CC-02 |
| **O — Egress** | Output only | Vendor export tables, compliance reports; no logic, no state | CC-02 |

---

## 6. Spokes (CC-03 Interfaces)

| Spoke Name | Type | Direction | Contract | CC Layer |
|------------|------|-----------|----------|----------|
| API Intake Endpoint | I | Inbound | Zod validation schema | CC-03 |
| Vendor Export API | O | Outbound | vendor_output_blueprint schema | CC-03 |
| Compliance Report | O | Outbound | compliance_vault schema | CC-03 |

---

## 7. Constants vs Variables

| Element | Type | Mutability | CC Layer |
|---------|------|------------|----------|
| Hub ID | Constant | Immutable | CC-02 |
| Hub Name | Constant | ADR-gated | CC-02 |
| Canonical Schema | Constant | ADR-gated | CC-02 |
| IMO Table Prefixes | Constant | Immutable | CC-02 |
| Vendor Mappings | Variable | Configuration | CC-03 |
| Validation Rules | Variable | Configuration | CC-03 |

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
| Schema Compliance | Validation | All tables follow IMO naming | CC-03 |
| Blueprint Versioning | Validation | validator_signature required | CC-04 |

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
| Neon promotion fails | CRITICAL | CC-02 | Roll back, log to shq.error_log |
| Vendor export malformed | HIGH | CC-03 | Validate against blueprint, retry |
| Audit log write fails | CRITICAL | CC-04 | Block all operations until resolved |

---

## 13. PID Scope (CC-04)

| Field | Value |
|-------|-------|
| **PID Pattern** | `client-subhive-${TIMESTAMP}-${RANDOM_HEX}` |
| **Retry Policy** | New PID per retry |
| **Audit Trail** | Required via shq.audit_log |

---

## 14. Human Override Rules

Human override is permitted for:

- Emergency data corrections (CC-01 authority required)
- Compliance exemptions (CC-01 authority required, ADR mandatory)
- Kill switch activation (CC-02 or CC-01 authority)

All overrides MUST be logged to shq.audit_log with human identifier.

---

## 15. Observability

| Type | Description | CC Layer |
|------|-------------|----------|
| **Logs** | shq.audit_log, shq.error_log | CC-04 |
| **Metrics** | Compliance score, intake success rate | CC-04 |
| **Alerts** | Critical errors via sidecar telemetry | CC-03/CC-04 |

---

## Approval

| Role | Name | Date |
|------|------|------|
| Sovereign (CC-01) | imo-creator | 2026-01-30 |
| Hub Owner (CC-02) | Barton Ops System | 2026-01-30 |
| Reviewer | Pending | |

---

## 16. Secrets Management

| Field | Value |
|-------|-------|
| **Provider** | Doppler (MANDATORY) |
| **Project** | client-subhive |
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

## Traceability

| Artifact | Reference |
|----------|-----------|
| Architecture Doctrine | ARCHITECTURE.md (v2.0.0) |
| Hub/Spoke Geometry | ARCHITECTURE.md Part IV |
| IMO Flow | ARCHITECTURE.md Part V |
| Descent Gates | ARCHITECTURE.md Part VI |
| Hub Design Declaration | HUB_DESIGN_DECLARATION.yaml |
| Semantic Access Map | doctrine/OSAM.md |
| IMO Schema | client_subhive_schema.sql |
| UI Constitution | docs/ui/UI_CONSTITUTION.md |
| Secrets Management | integrations/DOPPLER.md |
| Domain Bindings | doctrine/REPO_DOMAIN_SPEC.md |
