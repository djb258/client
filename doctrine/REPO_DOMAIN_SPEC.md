# Repository Domain Specification

**Hub ID:** client-subhive
**Hub Name:** Client Intake & Vendor Export System
**Parent:** imo-creator

---

## Purpose

This document maps generic IMO-Creator roles to domain-specific tables and concepts for the Client Intake & Vendor Export System.

---

## Domain Binding: Constants

| Generic Role | Domain Binding | Table/Source |
|--------------|----------------|--------------|
| Upstream Authority | imo-creator | Parent doctrine |
| Raw Input Source | API Intake Endpoint | REST API / Direct Input |
| Intake Schema | API Validation | Zod schemas |
| Vendor Blueprints | Configuration | ctb/data/db/registry/ |

---

## Domain Binding: Variables

| Generic Role | Domain Binding | Table/Destination |
|--------------|----------------|-------------------|
| Canonical Entity | Company Record | clnt.company_master |
| Canonical Entity | Employee Record | clnt.employee_master |
| Derived Output | Vendor Export | clnt.vendor_output_blueprint |
| Audit Trail | Process Log | shq.audit_log |
| Error Log | Error Records | shq.error_log |

---

## IMO Layer Binding

### Ingress (I) Layer

| Generic | Domain Specific |
|---------|-----------------|
| Raw Input | clnt_i_raw_input |
| Profile | clnt_i_profile |
| Staging Schema | staging.raw_intake_* |

### Middle (M) Layer

| Generic | Domain Specific |
|---------|-----------------|
| Master Entity | clnt_m_client |
| Person Entity | clnt_m_person |
| Plan Entity | clnt_m_plan |
| Cost Entity | clnt_m_plan_cost |
| Election Entity | clnt_m_election |
| Link Entity | clnt_m_vendor_link |
| Document Entity | clnt_m_spd |

### Egress (O) Layer

| Generic | Domain Specific |
|---------|-----------------|
| Output Record | clnt_o_output |
| Run Log | clnt_o_output_run |
| Compliance Record | clnt_o_compliance |

---

## Agent Binding

| Generic Role | Domain Agent | Altitude |
|--------------|--------------|----------|
| Strategic Orchestrator | SUBAGENT-DELEGATOR | 30,000 ft |
| MCP Orchestrator | REPO-MCP-ORCHESTRATOR | 30,000 ft |
| Intake Validator | SHQ-INTAKE-VALIDATOR | 20,000 ft |
| Compliance Checker | COMPLIANCE-CHECKER | 20,000 ft |
| Export Transformer | VENDOR-EXPORT-AGENT | 10,000 ft |

---

## Schema Binding

| Generic Schema | Domain Schema | Purpose |
|----------------|---------------|---------|
| Canonical | clnt | Core business data |
| Audit | shq | System health and logging |
| Staging | staging | Intake processing |
| Core | core | Normalized master data |
| Benefits | benefits | Benefit-specific data |
| Compliance | compliance | Regulatory data |
| Operations | operations | Operational tracking |

---

## Spoke Binding

### Ingress Spokes

| Spoke ID | Domain Interface | Contract |
|----------|------------------|----------|
| api-intake | REST API Endpoint | OpenAPI schema |
| direct-intake | Direct Data Import | Zod validation schema |

### Egress Spokes

| Spoke ID | Domain Interface | Contract |
|----------|------------------|----------|
| vendor-export | Vendor Export API | vendor_output_blueprint |
| compliance-report | Compliance Reporting | compliance_vault schema |

---

## Traceability

| Artifact | Reference |
|----------|-----------|
| Bootstrap Guide | CLAUDE.md |
| Hub Constitution | CONSTITUTION.md |
| Hub Doctrine | DOCTRINE.md |
| Canonical PRD | docs/prd/PRD.md |
| Architecture ADR | docs/adr/ADR-001-architecture.md |
| UI Governance | docs/ui/UI_CONSTITUTION.md |
| Canonical Schema | client_subhive_schema.sql |

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-01-30 |
| Status | ACTIVE |
| Authority | Inherits from imo-creator |
