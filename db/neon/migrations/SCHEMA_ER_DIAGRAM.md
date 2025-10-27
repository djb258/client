# Barton Client Database - Entity Relationship Diagram

## Overview

This document provides visual representations of the Barton Client Database (`clnt`) schema relationships.

---

## 🗺️ Complete Schema Map

```mermaid
erDiagram
    %% =====================================================
    %% CORE SCHEMA (Identity Backbone)
    %% =====================================================
    core_company_master {
        TEXT company_uid PK
        TEXT company_name
        TEXT ein
        TEXT status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    core_employee_master {
        TEXT employee_uid PK
        TEXT company_uid FK
        TEXT first_name
        TEXT last_name
        DATE hire_date
        TEXT employment_status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    core_entity_relationship {
        SERIAL relationship_id PK
        TEXT from_entity_uid
        TEXT to_entity_uid
        TEXT relationship_type
        DATE effective_date
        DATE end_date
        TEXT status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    %% =====================================================
    %% BENEFITS SCHEMA (Vendor + Plan References)
    %% =====================================================
    benefits_vendor_link {
        TEXT vendor_id PK
        TEXT company_uid FK
        TEXT vendor_name
        TEXT vendor_type
        TEXT group_number
        TEXT integration_type
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    benefits_employee_vendor_id {
        TEXT vendor_emp_uid PK
        TEXT employee_uid FK
        TEXT vendor_id FK
        TEXT vendor_employee_id
        TEXT status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    %% =====================================================
    %% COMPLIANCE SCHEMA (Rules + State/Federal Layer)
    %% =====================================================
    compliance_compliance_vault {
        TEXT compliance_id PK
        TEXT company_uid FK
        BOOLEAN self_insured
        BOOLEAN erisa_applicable
        BOOLEAN aca_applicable
        JSONB fmla_state_rules
        DATE plan_year_start
        DATE plan_year_end
        JSONB required_forms
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    %% =====================================================
    %% OPERATIONS SCHEMA (Audit + Tickets)
    %% =====================================================
    operations_audit_data_lineage {
        SERIAL lineage_id PK
        TEXT entity_uid
        TEXT attribute_code
        TEXT attribute_value
        TEXT action_type
        TEXT version_hash
        TIMESTAMP timestamp_used
        TEXT filled_by
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    %% =====================================================
    %% STAGING SCHEMA (Raw Intake)
    %% =====================================================
    staging_raw_intake_company {
        SERIAL intake_id PK
        JSONB raw_data
        TEXT source
        BOOLEAN processed
        TIMESTAMP created_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    staging_raw_intake_employee {
        SERIAL intake_id PK
        JSONB raw_data
        TEXT source
        BOOLEAN processed
        TIMESTAMP created_at
        INT column_number
        TEXT column_description
        TEXT column_format
    }

    %% =====================================================
    %% RELATIONSHIPS
    %% =====================================================

    %% Core Schema Relationships
    core_company_master ||--o{ core_employee_master : "employs"

    %% Benefits Schema Relationships
    core_company_master ||--o{ benefits_vendor_link : "contracts with"
    core_employee_master ||--o{ benefits_employee_vendor_id : "has vendor IDs"
    benefits_vendor_link ||--o{ benefits_employee_vendor_id : "provides IDs for"

    %% Compliance Schema Relationships
    core_company_master ||--o{ compliance_compliance_vault : "has compliance rules"

    %% Operations Schema Relationships
    %% (audit_data_lineage references entities via entity_uid - no formal FK)

    %% Staging Schema Relationships
    %% (raw intake tables have no formal FKs - data validated before promotion)
```

---

## 🔍 Schema-Level Relationships

This diagram shows only the inter-schema relationships:

```mermaid
graph TD
    %% Schema Boxes
    CORE["`**core**
    Identity Backbone
    - company_master
    - employee_master
    - entity_relationship`"]

    BENEFITS["`**benefits**
    Vendor + Plan References
    - vendor_link
    - employee_vendor_id`"]

    COMPLIANCE["`**compliance**
    Rules + State/Federal
    - compliance_vault`"]

    OPERATIONS["`**operations**
    Audit + Tickets
    - audit_data_lineage`"]

    STAGING["`**staging**
    Raw Intake
    - raw_intake_company
    - raw_intake_employee`"]

    %% Relationships
    CORE --> BENEFITS
    CORE --> COMPLIANCE
    STAGING -.-> CORE
    CORE -.-> OPERATIONS
    BENEFITS -.-> OPERATIONS
    COMPLIANCE -.-> OPERATIONS

    %% Styling
    classDef coreStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef benefitsStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef complianceStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef operationsStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef stagingStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class CORE coreStyle
    class BENEFITS benefitsStyle
    class COMPLIANCE complianceStyle
    class OPERATIONS operationsStyle
    class STAGING stagingStyle
```

**Legend**:
- Solid arrows (→) represent direct foreign key relationships
- Dashed arrows (-.→) represent logical/audit relationships (no enforced FK)

---

## 📊 Data Flow Diagram

This diagram shows how data flows through the system:

```mermaid
flowchart TB
    %% External Sources
    UI[UI Intake Wizard]
    API[API Import]
    CSV[CSV/Excel Import]

    %% Staging Layer
    STAGE_CO[staging.raw_intake_company]
    STAGE_EMP[staging.raw_intake_employee]

    %% Validation
    VALIDATE{Validation Agent<br/>SHQ-INTAKE-VALIDATOR}

    %% Core Layer
    CORE_CO[core.company_master]
    CORE_EMP[core.employee_master]

    %% Enrichment Layers
    BEN_VEND[benefits.vendor_link]
    BEN_EMP[benefits.employee_vendor_id]
    COMP[compliance.compliance_vault]

    %% Audit Layer
    AUDIT[operations.audit_data_lineage]

    %% Export
    EXPORT[Vendor Export Agent]
    OUTPUT[Vendor Output Tables]

    %% Flow
    UI --> STAGE_CO
    UI --> STAGE_EMP
    API --> STAGE_CO
    API --> STAGE_EMP
    CSV --> STAGE_CO
    CSV --> STAGE_EMP

    STAGE_CO --> VALIDATE
    STAGE_EMP --> VALIDATE

    VALIDATE -->|Valid| CORE_CO
    VALIDATE -->|Valid| CORE_EMP
    VALIDATE -->|Invalid| AUDIT

    CORE_CO --> BEN_VEND
    CORE_CO --> COMP
    CORE_EMP --> BEN_EMP

    CORE_CO --> AUDIT
    CORE_EMP --> AUDIT
    BEN_VEND --> AUDIT
    BEN_EMP --> AUDIT
    COMP --> AUDIT

    CORE_CO --> EXPORT
    CORE_EMP --> EXPORT
    BEN_VEND --> EXPORT
    BEN_EMP --> EXPORT

    EXPORT --> OUTPUT
    EXPORT --> AUDIT

    %% Styling
    classDef stagingClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef coreClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef benefitsClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef complianceClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef operationsClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef processClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px,stroke-dasharray: 5 5
    classDef outputClass fill:#ffebee,stroke:#b71c1c,stroke-width:2px

    class STAGE_CO,STAGE_EMP stagingClass
    class CORE_CO,CORE_EMP coreClass
    class BEN_VEND,BEN_EMP benefitsClass
    class COMP complianceClass
    class AUDIT operationsClass
    class VALIDATE,EXPORT processClass
    class OUTPUT outputClass
```

---

## 🏛️ Core Schema Detail

```mermaid
erDiagram
    core_company_master ||--o{ core_employee_master : "employs"

    core_company_master {
        TEXT company_uid PK "e.g., CLNT-0001"
        TEXT company_name "Company legal name"
        TEXT ein "Employer ID Number"
        TEXT status "active, inactive, suspended"
    }

    core_employee_master {
        TEXT employee_uid PK "e.g., EMP-0001"
        TEXT company_uid FK "Reference to company"
        TEXT first_name
        TEXT last_name
        DATE hire_date
        TEXT employment_status "active, terminated, leave"
    }

    core_entity_relationship {
        SERIAL relationship_id PK
        TEXT from_entity_uid "Source entity"
        TEXT to_entity_uid "Target entity"
        TEXT relationship_type "manager_employee, partner, etc."
        TEXT status "active, inactive"
    }
```

---

## 💼 Benefits Schema Detail

```mermaid
erDiagram
    benefits_vendor_link ||--o{ benefits_employee_vendor_id : "provides IDs"

    benefits_vendor_link {
        TEXT vendor_id PK "e.g., VEND-GUARDIAN"
        TEXT company_uid FK "Reference to company"
        TEXT vendor_name "Guardian Life"
        TEXT vendor_type "Carrier, TPA, PBM, Broker"
        TEXT group_number "Company group number"
        TEXT integration_type "API, SFTP, Portal, Manual"
    }

    benefits_employee_vendor_id {
        TEXT vendor_emp_uid PK "Unique cross-reference ID"
        TEXT employee_uid FK "Reference to employee"
        TEXT vendor_id FK "Reference to vendor"
        TEXT vendor_employee_id "Vendor's employee ID"
        TEXT status "active, inactive"
    }
```

**Key Constraint**: `UNIQUE (employee_uid, vendor_id)` prevents duplicate vendor IDs per employee.

---

## ⚖️ Compliance Schema Detail

```mermaid
erDiagram
    compliance_compliance_vault {
        TEXT compliance_id PK "e.g., COMP-0001"
        TEXT company_uid FK "Reference to company"
        BOOLEAN self_insured "Self-insured status"
        BOOLEAN erisa_applicable "ERISA applies?"
        BOOLEAN aca_applicable "ACA applies?"
        JSONB fmla_state_rules "State-specific rules"
        DATE plan_year_start "Plan year start"
        DATE plan_year_end "Plan year end"
        JSONB required_forms "Form 5500, 1095-C, etc."
    }
```

**JSONB Examples**:
```json
// fmla_state_rules
{
  "state": "CA",
  "enhanced_leave": true,
  "weeks_available": 12
}

// required_forms
["Form 5500", "1095-C", "Summary Plan Description"]
```

---

## 📋 Operations Schema Detail

```mermaid
erDiagram
    operations_audit_data_lineage {
        SERIAL lineage_id PK "Auto-increment ID"
        TEXT entity_uid "company_uid, employee_uid, etc."
        TEXT attribute_code "Field name that changed"
        TEXT attribute_value "Value at this version"
        TEXT action_type "CREATE, UPDATE, DELETE, EXPORT"
        TEXT version_hash "Integrity hash"
        TIMESTAMP timestamp_used "When version was active"
        TEXT filled_by "User, agent, or system"
    }
```

**Usage**: Every data modification across all schemas should log to this table for complete audit trails.

---

## 📥 Staging Schema Detail

```mermaid
erDiagram
    staging_raw_intake_company {
        SERIAL intake_id PK "Auto-increment ID"
        JSONB raw_data "Complete unvalidated data"
        TEXT source "UI, API, CSV, Excel, Manual"
        BOOLEAN processed "Promoted to core?"
        TIMESTAMP created_at "Intake timestamp"
    }

    staging_raw_intake_employee {
        SERIAL intake_id PK "Auto-increment ID"
        JSONB raw_data "Complete unvalidated data"
        TEXT source "UI, API, CSV, Excel, Manual"
        BOOLEAN processed "Promoted to core?"
        TIMESTAMP created_at "Intake timestamp"
    }
```

**Workflow**:
1. Data lands in staging with `processed = FALSE`
2. Validation agent checks data quality
3. Valid data promoted to `core.*` tables
4. Record marked `processed = TRUE`
5. Invalid data generates error logs

---

## 🔐 Doctrine Metadata Columns

Every table includes these columns for compliance:

```mermaid
classDiagram
    class DoctrineMetadata {
        +INT column_number
        +TEXT column_description
        +TEXT column_format
        +TIMESTAMP created_at
        +TIMESTAMP updated_at
    }

    note for DoctrineMetadata "Present on ALL tables
    STAMPED/SPVPET compliance
    Supports blueprint versioning"
```

---

## 🚀 Extensibility Examples

### Adding a New Table to Existing Schema

```mermaid
erDiagram
    benefits_vendor_link ||--o{ benefits_plan_master : "offers"

    benefits_plan_master {
        TEXT plan_id PK
        TEXT vendor_id FK
        TEXT plan_name
        TEXT plan_type
        NUMERIC monthly_premium
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

### Adding a New Schema

```mermaid
graph TD
    CORE[core schema]
    PAYROLL[payroll schema<br/>NEW]

    CORE --> PAYROLL

    PAYROLL_TABLE[payroll.payroll_master<br/>- payroll_id<br/>- employee_uid FK<br/>- pay_period_start<br/>- pay_period_end]

    classDef newSchema fill:#ffe082,stroke:#ff6f00,stroke-width:3px,stroke-dasharray: 5 5
    class PAYROLL,PAYROLL_TABLE newSchema
```

**No migration conflicts** - schemas are independent and loosely coupled.

---

## 📈 Key Relationships Summary

| From Schema | To Schema | Relationship Type | Description |
|------------|-----------|------------------|-------------|
| `core` | `benefits` | 1:N (FK) | Companies contract with vendors |
| `core` | `benefits` | 1:N (FK) | Employees have vendor-specific IDs |
| `core` | `compliance` | 1:N (FK) | Companies have compliance rules |
| `staging` | `core` | Logical | Raw data promoted after validation |
| `core` | `operations` | Logical | All core changes logged to audit |
| `benefits` | `operations` | Logical | All benefit changes logged to audit |
| `compliance` | `operations` | Logical | All compliance changes logged to audit |

**Total Foreign Keys**: 5 enforced FKs
**Total Logical Relationships**: 4 audit/validation relationships

---

## 📝 Notes

1. **Clean DAG Structure**: No circular dependencies
2. **Loose Coupling**: Schemas can be expanded independently
3. **Audit Everything**: All operations log to `operations.audit_data_lineage`
4. **Validation Layer**: Staging isolates raw data from canonical tables
5. **Vendor ID Strategy**: `benefits.employee_vendor_id` handles vendor-specific employee IDs

---

**Diagram Version**: 1.0.0
**Created**: 2025-10-27
**Database**: clnt
**Tool**: Mermaid (GitHub/Markdown compatible)
