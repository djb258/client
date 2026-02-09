# CTB Governance Document

**Version**: 1.0.0
**Status**: ACTIVE
**Authority**: Derived from `doctrine/ARCHITECTURE.md`
**Change Protocol**: ADR + HUMAN APPROVAL REQUIRED

---

## Purpose

This document defines the CTB (Christmas Tree Backbone) governance structure for the client-subhive repository. It tracks:

- **Table Classification**: Every table has a designated leaf type
- **Governance Enforcement**: Frozen tables cannot be modified without formal change request
- **Drift Detection**: Automated identification of schema inconsistencies
- **Audit Trail**: Complete history of table modifications and violations

---

## 1. Overview

### 1.1 CTB Registry Location

```
Schema: clnt2
Tables:
  - Ingress: clnt_i_raw_input, clnt_i_profile
  - Middle: clnt_m_client, clnt_m_person, clnt_m_plan, clnt_m_plan_cost, clnt_m_election, clnt_m_vendor_link, clnt_m_spd
  - Egress: clnt_o_output, clnt_o_output_run, clnt_o_compliance
```

### 1.2 Quick Reference

| Metric | Value |
|--------|-------|
| Total Tables Registered | 12 |
| Frozen Core Tables | 3 |
| Current Violations | 0 |
| Join Key Integrity | ALIGNED |

---

## 2. Leaf Type Classification

Every table in the database is assigned exactly one leaf type:

| Leaf Type | Count | Description | Modification Rules |
|-----------|-------|-------------|-------------------|
| **CANONICAL** | 7 | Primary data tables (Middle layer) | Normal write access |
| **STAGING** | 2 | Intake/staging tables (Ingress layer) | Temporary data |
| **CANONICAL** | 3 | Output/export tables (Egress layer) | Normal write access |

### 2.1 Full Table Registry

| Schema | Table | Leaf Type | IMO Layer | Is Frozen |
|--------|-------|-----------|-----------|-----------|
| clnt2 | clnt_i_raw_input | STAGING | I | No |
| clnt2 | clnt_i_profile | STAGING | I | No |
| clnt2 | clnt_m_client | CANONICAL | M | Yes |
| clnt2 | clnt_m_person | CANONICAL | M | Yes |
| clnt2 | clnt_m_plan | CANONICAL | M | Yes |
| clnt2 | clnt_m_plan_cost | CANONICAL | M | No |
| clnt2 | clnt_m_election | CANONICAL | M | No |
| clnt2 | clnt_m_vendor_link | CANONICAL | M | No |
| clnt2 | clnt_m_spd | CANONICAL | M | No |
| clnt2 | clnt_o_output | CANONICAL | O | No |
| clnt2 | clnt_o_output_run | CANONICAL | O | No |
| clnt2 | clnt_o_compliance | CANONICAL | O | No |

---

## 3. Frozen Core Tables

The following tables are **FROZEN** and require formal change request before modification:

| Schema | Table | Purpose |
|--------|-------|---------|
| clnt2 | clnt_m_client | Spine table - authoritative source of client identity |
| clnt2 | clnt_m_person | Core entity - employee and dependent records |
| clnt2 | clnt_m_plan | Core entity - benefit plan definitions |

### 3.1 Change Request Process

To modify a frozen table:

1. Create ADR documenting the change rationale
2. Get approval from system owner
3. Execute change with audit trail
4. Update CTB registry if needed

---

## 4. Column Contracts

### 4.1 NOT NULL Constraints

Core tables have mandatory identity columns:

| Table | Column | Constraint |
|-------|--------|------------|
| clnt_m_client | client_id | NOT NULL, PRIMARY KEY (UUID) |
| clnt_m_person | person_id | NOT NULL, PRIMARY KEY (UUID) |
| clnt_m_person | client_id | NOT NULL, FOREIGN KEY |
| clnt_m_plan | plan_id | NOT NULL, PRIMARY KEY (UUID) |
| clnt_m_plan | client_id | NOT NULL, FOREIGN KEY |

---

## 5. Drift Detection

### 5.1 Drift Types

| Type | Description | Action |
|------|-------------|--------|
| `DEPRECATED_WITH_DATA` | Legacy tables with data | Archive or delete |
| `MISSING_CONTRACT` | Key columns without documentation | Add CTB_CONTRACT comment |
| `UNREGISTERED_TABLE` | Tables not in CTB registry | Register or drop |

### 5.2 Current Drift Status

| Type | Count | Notes |
|------|-------|-------|
| DEPRECATED_WITH_DATA | 0 | None detected |
| MISSING_CONTRACT | 0 | Pending initial audit |
| UNREGISTERED_TABLE | 0 | All tables registered |

---

## 6. CTB Phase History

| Phase | Tag | Date | Scope |
|-------|-----|------|-------|
| Constitutional Admission | v0.1.0 | 2026-01-30 | Initial governance files |
| Structural Instantiation | v1.0.0 | 2026-02-05 | Schema, migrations, CTB branches |
| Template Sync | v1.1.0 | 2026-02-09 | ARCHITECTURE.md v2.0.0 alignment |

---

## 7. Governance Rules

### 7.1 Table Creation

New tables must follow IMO naming convention:
- `clnt_i_*` for Ingress tables
- `clnt_m_*` for Middle tables
- `clnt_o_*` for Egress tables

### 7.2 Table Modification

- **CANONICAL**: Normal DDL allowed
- **FROZEN**: Requires formal change request (ADR)
- **STAGING**: Temporary data, flexible modification

### 7.3 Table Deletion

Tables should be deprecated before deletion:
1. Mark as DEPRECATED in registry
2. Schedule removal date
3. Migrate dependent queries
4. Drop after verification

---

## 8. Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture Doctrine | `templates/doctrine/ARCHITECTURE.md` | CTB constitutional law |
| CTB Doctrine | `templates/config/CTB_DOCTRINE.md` | CTB quick reference |
| OSAM | `doctrine/OSAM.md` | Semantic access map |
| ERD Metrics | `erd/ERD_METRICS.yaml` | Runtime table metrics |

---

## Document Control

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Created | 2026-02-09 |
| Author | Claude Code |
| Status | ACTIVE |
| Review Cycle | Quarterly |
| Change Protocol | ADR REQUIRED |
