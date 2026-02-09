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
| Intake | intake | API-based intake for company and employee data |
| Canonical Vault | canonical | Neon PostgreSQL canonical data storage |
| Vendor Export | export | Vendor-specific data export generation |

---

## Fact Schema Bindings

| Generic Role | Domain Table | Owner Schema | Description (10 words max) |
|--------------|--------------|--------------|---------------------------|
| FACT_TABLE | clnt_m_client | clnt2 | Canonical client identity records |
| FACT_TABLE | clnt_m_person | clnt2 | Employee and dependent records |
| FACT_TABLE | clnt_m_plan | clnt2 | Benefit plan definitions |
| FACT_TABLE | clnt_m_election | clnt2 | Benefit election records |

---

## Intent Layer Bindings

| Generic Role | Domain Column/Table | Data Type | Description (10 words max) |
|--------------|---------------------|-----------|---------------------------|
| LIFECYCLE_STATE | clnt_m_client.status | VARCHAR | Client lifecycle state (active, suspended, terminated) |

---

## External Boundaries

| External System | Direction | Data Exchanged | Boundary Type |
|-----------------|-----------|----------------|---------------|
| API Intake Endpoint | INGRESS | Company, employee, benefit data | API |
| Vendor Export (Guardian Life) | EGRESS | Vendor-formatted export records | File |
| Vendor Export (Mutual of Omaha) | EGRESS | Vendor-formatted export records | File |
| Compliance Reporting | EGRESS | Compliance status reports | API |

---

## Data Classes Owned

| Data Class | Tables | Owner Hub | Mutability |
|------------|--------|-----------|------------|
| Client Identity | clnt_m_client | client-subhive | CONST |
| Employee Records | clnt_m_person | client-subhive | CONST |
| Benefit Plans | clnt_m_plan, clnt_m_plan_cost | client-subhive | CONST |
| Benefit Elections | clnt_m_election | client-subhive | VAR |
| Vendor Links | clnt_m_vendor_link | client-subhive | VAR |
| Summary Plan Descriptions | clnt_m_spd | client-subhive | CONST |
| Raw Intake | clnt_i_raw_input, clnt_i_profile | client-subhive | VAR |
| Export Output | clnt_o_output, clnt_o_output_run | client-subhive | VAR |
| Compliance Records | clnt_o_compliance | client-subhive | VAR |

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
| Intake Lane | clnt_i_raw_input, clnt_i_profile | SOURCE only, no direct query |
| Canonical Lane | clnt_m_client, clnt_m_person, clnt_m_plan, clnt_m_plan_cost, clnt_m_election, clnt_m_vendor_link, clnt_m_spd | Primary query surface |
| Export Lane | clnt_o_output, clnt_o_output_run, clnt_o_compliance | Read-only output projection |

---

## Downstream Consumers (Read-Only)

| Consumer | Access Level | Tables Exposed |
|----------|--------------|----------------|
| Vendor Export Interface | READ | clnt_o_output, clnt_o_output_run |
| Compliance Reporting | READ | clnt_o_compliance |

---

## Forbidden Joins

| Source Table | Target Table | Reason |
|--------------|--------------|--------|
| clnt_i_raw_input | clnt_o_output | Cross-lane isolation (intake to export) |
| clnt_i_profile | clnt_o_compliance | Cross-lane isolation (intake to export) |
| clnt_o_output | clnt_m_person | Egress cannot access Middle directly |

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
| Last Modified | 2026-02-09 |
| Version | 2.0.0 |
| Status | ACTIVE |
| Parent Doctrine | IMO-Creator |
| Validated | [x] YES |
