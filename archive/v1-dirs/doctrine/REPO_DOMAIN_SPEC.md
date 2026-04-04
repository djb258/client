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

## Hub and Spoke Structure (v3.0.0 — 5 Spokes, 16 Tables)

| Hub/Spoke | ID | Purpose (10 words max) |
|-----------|----|-----------------------|
| Client Hub | client-subhive | Client intake, canonical storage, vendor export |
| S1 Hub | s1-hub | Root client identity, config, branding (SPINE) |
| S2 Plan | s2-plan | Benefit plans, rates, and renewal quotes |
| S3 Employee | s3-employee | Employee identity, enrollment staging, elections |
| S4 Vendor | s4-vendor | Vendor identity, ID translation, invoices |
| S5 Service | s5-service | Service ticket tracking |

---

## Fact Schema Bindings

| Generic Role | Domain Table | Owner Schema | Description (10 words max) |
|--------------|--------------|--------------|---------------------------|
| FACT_TABLE (SPINE) | client | clnt | Sovereign client identity, config, branding (merged) |
| FACT_TABLE | plan | clnt | Canonical benefit plans with embedded rates |
| FACT_TABLE | person | clnt | Employee and dependent records |
| FACT_TABLE | vendor | clnt | Vendor identity per client |
| FACT_TABLE | service_request | clnt | Service tickets |
| SUPPORT_TABLE | plan_quote | clnt | Received carrier quotes for comparison |
| SUPPORT_TABLE | election | clnt | Benefit election bridge (person to plan) |
| SUPPORT_TABLE | external_identity_map | clnt | Vendor ID translation |
| SUPPORT_TABLE | invoice | clnt | Vendor invoices |
| STAGING_TABLE | enrollment_intake | clnt | Batch header for enrollment staging |
| STAGING_TABLE | intake_record | clnt | Raw payload (immutable) |
| ERROR_TABLE | client_error | clnt | Client-level errors |
| ERROR_TABLE | plan_error | clnt | Plan-level errors |
| ERROR_TABLE | employee_error | clnt | Employee-level errors |
| ERROR_TABLE | vendor_error | clnt | Vendor-level errors |
| ERROR_TABLE | service_error | clnt | Service-level errors |

---

## Intent Layer Bindings

| Generic Role | Domain Column/Table | Data Type | Description (10 words max) |
|--------------|---------------------|-----------|---------------------------|
| LIFECYCLE_STATE | client.status | TEXT | Client lifecycle state (active, suspended, terminated) |
| QUOTE_LIFECYCLE | plan_quote.status | TEXT | Quote status (received, presented, selected, rejected) |

---

## External Boundaries

| External System | Direction | Data Exchanged | Boundary Type |
|-----------------|-----------|----------------|---------------|
| API Intake Endpoint | INGRESS | Company, employee, benefit data | API |
| Quote Intake | INGRESS | Carrier renewal quotes | API |
| Vendor Export (Guardian Life) | EGRESS | Vendor-formatted export records | File |
| Vendor Export (Mutual of Omaha) | EGRESS | Vendor-formatted export records | File |

---

## Data Classes Owned

| Data Class | Tables | Owner Hub | Mutability |
|------------|--------|-----------|------------|
| Client Identity | client | client-subhive | CONST |
| Employee Records | person | client-subhive | CONST |
| Benefit Plans | plan | client-subhive | CONST |
| Plan Quotes | plan_quote | client-subhive | VAR |
| Benefit Elections | election | client-subhive | VAR |
| Vendor Identity | vendor, external_identity_map, invoice | client-subhive | VAR |
| Service Tracking | service_request | client-subhive | VAR |
| Raw Intake | enrollment_intake, intake_record | client-subhive | VAR |
| Error Tracking | client_error, plan_error, employee_error, vendor_error, service_error | client-subhive | VAR |

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
| Intake Lane | enrollment_intake, intake_record | STAGING only, one-way to Employee, no direct query |
| Canonical Lane | client, plan, plan_quote, person, election, vendor, external_identity_map, invoice, service_request | Primary query surface |
| Error Lane | client_error, plan_error, employee_error, vendor_error, service_error | Error capture per spoke, no business query |

---

## Downstream Consumers (Read-Only)

| Consumer | Access Level | Tables Exposed |
|----------|--------------|----------------|
| Vendor Export Interface | READ | vendor, external_identity_map, invoice |

---

## Forbidden Joins

| Source Table | Target Table | Reason |
|--------------|--------------|--------|
| intake_record | person (direct) | Intake -> Employee is one-way; must route through promotion |
| intake_record | plan (direct) | Intake -> Plan is one-way; must route through promotion |
| external_identity_map | client (ID replacement) | External IDs must never replace internal UUIDs |

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
- [x] At least 1 Hub/Spoke defined (5 spokes)
- [x] At least 1 Fact Schema binding (16 tables)
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
| Last Modified | 2026-02-25 |
| Version | 3.4.1 |
| Status | ACTIVE |
| Parent Doctrine | IMO-Creator |
| Validated | [x] YES |
