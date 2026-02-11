# Repository Domain Specification

**Repository**: client
**Domain**: client
**Parent**: IMO-Creator
**Status**: ACTIVE

---

## CRITICAL: What This File MUST NOT Contain

- NO SQL statements
- NO code snippets or functions
- NO workflow logic or decision trees
- NO scoring formulas or calculations
- NO implementation details
- NO prose descriptions of "how it works"

This file contains BINDINGS ONLY -- mapping generic roles to domain-specific names.

---

## Domain Identity

| Field | Value |
|-------|-------|
| Domain Name | client |
| Sovereign Reference | imo-creator |
| Hub ID | client-subhive |

---

## Hub and Sub-Hub Structure

| Hub/Sub-Hub | ID | Purpose (10 words max) |
|-------------|----|-----------------------|
| Client Hub | client-subhive | Client intake, canonical storage, vendor export |
| S1 Hub | hub | Root client identity and legal details |
| S2 Plan | plan | Benefit plans and renewal quote intake |
| S3 Intake | intake | Enrollment staging (one-way) |
| S4 Vault | vault | Employee identity and benefit elections |
| S5 Vendor | vendor | Vendor identity and ID translation |
| S6 Service | service | Service ticket tracking |
| S7 Compliance | compliance | Compliance flag tracking |
| S8 Audit | audit | Append-only system audit trail |

---

## Fact Schema Bindings

| Generic Role | Domain Table | Owner Schema | Description (10 words max) |
|--------------|--------------|--------------|---------------------------|
| FACT_TABLE | client_hub | clnt | Root client identity (FROZEN after creation) |
| FACT_TABLE | client_master | clnt | Client legal and business details |
| FACT_TABLE | plan | clnt | Canonical benefit plans with embedded rates |
| FACT_TABLE | person | clnt | Employee and dependent records |
| FACT_TABLE | election | clnt | Benefit election bridge (person to plan) |
| SUPPORT_TABLE | plan_quote | clnt | Received carrier quotes for comparison |

---

## Intent Layer Bindings

| Generic Role | Domain Column/Table | Data Type | Description (10 words max) |
|--------------|---------------------|-----------|---------------------------|
| LIFECYCLE_STATE | client_hub.status | TEXT | Client lifecycle state (active, suspended, terminated) |
| QUOTE_LIFECYCLE | plan_quote.status | TEXT | Quote status (received, presented, selected, rejected) |

---

## External Boundaries

| External System | Direction | Data Exchanged | Boundary Type |
|-----------------|-----------|----------------|---------------|
| API Intake Endpoint | INGRESS | Company, employee, benefit data | API |
| Quote Intake | INGRESS | Carrier renewal quotes | API |
| Vendor Export (Guardian Life) | EGRESS | Vendor-formatted export records | File |
| Vendor Export (Mutual of Omaha) | EGRESS | Vendor-formatted export records | File |
| Compliance Reporting | EGRESS | Compliance flag reports | API |

---

## Data Classes Owned

| Data Class | Tables | Owner Hub | Mutability |
|------------|--------|-----------|------------|
| Client Identity | client_hub, client_master | client-subhive | CONST |
| Employee Records | person | client-subhive | CONST |
| Benefit Plans | plan | client-subhive | CONST |
| Plan Quotes | plan_quote | client-subhive | VAR |
| Benefit Elections | election | client-subhive | VAR |
| Vendor Identity | vendor, external_identity_map | client-subhive | VAR |
| Service Tracking | service_request | client-subhive | VAR |
| Compliance Flags | compliance_flag | client-subhive | VAR |
| Raw Intake | intake_batch, intake_record | client-subhive | VAR |
| Audit Trail | audit_event | client-subhive | CONST (append-only) |

---

## Approved Tools (Snap-On IDs)

| Tool ID | Purpose | Usage Layer |
|---------|---------|-------------|
| NONE | No external SNAP-ON tools currently required | MIDDLE |

**Reference**: templates/SNAP_ON_TOOLBOX.yaml

---

## Lane Definitions

| Lane Name | Tables Included | Isolation Rule |
|-----------|-----------------|----------------|
| Intake Lane | intake_batch, intake_record | STAGING only, one-way to Vault, no direct query |
| Canonical Lane | client_hub, client_master, plan, plan_quote, person, election, vendor, external_identity_map, service_request, compliance_flag | Primary query surface |
| Audit Lane | audit_event | Append-only, system write only, no business query |

---

## Downstream Consumers (Read-Only)

| Consumer | Access Level | Tables Exposed |
|----------|--------------|----------------|
| Vendor Export Interface | READ | vendor, external_identity_map |
| Compliance Reporting | READ | compliance_flag |

---

## Forbidden Joins

| Source Table | Target Table | Reason |
|--------------|--------------|--------|
| intake_record | person (direct) | Intake -> Vault is one-way; must route through promotion |
| intake_record | plan (direct) | Intake -> Plan is one-way; must route through promotion |
| audit_event | Any table (as business query) | Audit is system log, not business query surface |
| external_identity_map | client_hub (ID replacement) | External IDs must never replace internal UUIDs |

---

## What This Repo Explicitly Does NOT Do

| Excluded Scope | Reason |
|----------------|--------|
| Vendor API integrations | Handled by separate hubs |
| Payment processing | Outside client data domain |
| User authentication | Infrastructure concern, not client data |
| Email delivery | Communication hub responsibility |
| Sales pipeline | Owned by outreach hub |

---

## Domain Lifecycle States

| State | Maps To Canonical | Description |
|-------|-------------------|-------------|
| pending | DRAFT | Client intake started, not validated |
| active | ACTIVE | Client validated and in canonical storage |
| suspended | SUSPENDED | Client temporarily disabled |
| terminated | TERMINATED | Client relationship ended |

---

## Binding Completeness Check

Before this file is valid, verify:

- [x] Domain Name: client
- [x] Sovereign Reference: imo-creator
- [x] Hub ID: client-subhive
- [x] At least 1 Hub/Sub-Hub defined
- [x] At least 1 Fact Schema binding
- [x] LIFECYCLE_STATE binding present
- [x] At least 1 External Boundary
- [x] At least 1 Data Class owned
- [x] Tool list completed (explicit "NONE")
- [x] At least 1 Lane definition
- [x] At least 1 "Does NOT Do" entry
- [x] All Lifecycle States map to canonical
- [x] NO SQL, code, or logic present
- [x] NO [FILL: ...] placeholders remain

---

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-01-30 |
| Last Modified | 2026-02-11 |
| Version | 3.0.0 |
| Status | ACTIVE |
| Parent Doctrine | IMO-Creator |
| Validated | [x] YES |
