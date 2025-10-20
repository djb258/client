# CTB (Canonical-to-Blueprint) Architecture Map

## Overview
The Client SubHive system follows a **5-layer Canonical-to-Blueprint (CTB)** architecture that enforces the Barton Doctrine (IMO + ORBT) for clean data flow and vendor neutrality.

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: UI Layer (React/TypeScript)                           │
│  ─────────────────────────────────────────────────────────────  │
│  • Client Intake Wizard (4-step wizard)                         │
│  • Dashboard & Reporting Interface                              │
│  • IMO Creator Blueprint Planning App                           │
│  • Barton Outreach Marketing Doctrine Interface                 │
│                                                                  │
│  Technologies: React 18, Vite, TailwindCSS, Radix UI            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: AI/Agent Layer (HEIR + MCP)                           │
│  ─────────────────────────────────────────────────────────────  │
│  • SHQ-INTAKE-VALIDATOR (validates Firebase → Neon promotion)   │
│  • VENDOR-EXPORT-AGENT (transforms canonical → vendor tables)   │
│  • COMPLIANCE-CHECKER (enforces repo standards)                 │
│  • Blueprint Scoring Agents (blueprint_score.py)                │
│  • Subagent Delegator (5 specialized agents)                    │
│                                                                  │
│  Technologies: Claude Agents, HEIR System, MCP Tools            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Application/Service Layer                             │
│  ─────────────────────────────────────────────────────────────  │
│  • Firebase Service (intake-service.ts)                         │
│  • Composio MCP Client (client-intake.ts)                       │
│  • Vendor Export Scripts (run_vendor_export.ts)                 │
│  • Migration Scripts (run_migrations_via_mcp.ts)                │
│  • Registry Validator (validate_registry.ts)                    │
│                                                                  │
│  Technologies: TypeScript, Node.js, FastAPI (Python)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Data/Storage Layer                                    │
│  ─────────────────────────────────────────────────────────────  │
│  INPUT: Firebase Firestore (temporary staging)                  │
│    • company collection (validated: false → true)               │
│    • employee collection (validated: false → true)              │
│    • intake_audit_log collection                                │
│                                                                  │
│  MIDDLE: Neon PostgreSQL - Canonical Schema (clnt.*)            │
│    • clients_subhive_master (company master table)              │
│    • clients_active_census (employee master table)              │
│    • employee_vendor_ids (cross-vendor employee tracking)       │
│    • benefit_master, employee_benefit_enrollment                │
│                                                                  │
│  OUTPUT: Neon PostgreSQL - Vendor-Specific Tables               │
│    • vendor_output_mutualofomaha                                │
│    • vendor_output_guardianlife                                 │
│    • vendor_output_blueprint (mapping definitions)              │
│                                                                  │
│  AUDIT: Neon PostgreSQL - System Schema (shq.*)                 │
│    • audit_log (all agent/validator actions)                    │
│                                                                  │
│  Technologies: Firebase, Neon (PostgreSQL), Composio Gateway    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: System/Infrastructure Layer                           │
│  ─────────────────────────────────────────────────────────────  │
│  • Garage MCP Server (Bay-based tool orchestration)             │
│  • Composio Integration Gateway (100+ services)                 │
│  • HEIR Error Handling (Altitude-based: 30k→5k ft)              │
│  • IMO Unified Registry (Central tool catalog)                  │
│  • Factory/Mechanic/Recall Systems (Build & repair)             │
│                                                                  │
│  Technologies: Python, MCP Protocol, YAML configs, Docker       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Barton Doctrine: IMO + ORBT

### IMO (Input-Middle-Output)
The data flow ALWAYS follows this path:

1. **INPUT Layer** (Firebase Firestore)
   - Temporary staging for manual intake
   - Validation occurs here before promotion
   - Blueprint versioning fields enforced:
     - `blueprint_version: "v1.0.0"`
     - `validator_signature: "SHQ-INTAKE-VALIDATOR"`
     - `timestamp_last_touched: ISO timestamp`

2. **MIDDLE Layer** (Neon Canonical Schema)
   - Permanent source of truth
   - Vendor-neutral data model
   - All tables in `clnt.*` schema
   - Master data: companies, employees, benefits, enrollments

3. **OUTPUT Layer** (Neon Vendor Tables)
   - Dynamically generated from blueprints
   - Vendor-specific field mappings
   - Export-ready format for each vendor
   - Tables: `vendor_output_*`

### ORBT (Outreach + Barton)
Marketing and operational doctrine:
- **Barton Outreach Core**: Marketing system integrated into client repo
- **Doctrine Map**: Hierarchical structure (Marketing > Outreach)
- **HEIR Agents**: Altitude-based coordination (30k, 20k, 15k, 10k, 5k ft)

---

## 🔄 Data Flow Example: Client Intake

```
User fills wizard
       ↓
[UI Layer] React Wizard Component
       ↓
[App Layer] Firebase Service (intake-service.ts)
       ↓
[Data Layer - INPUT] Firestore `company` collection
       ↓ (validated: false → true)
[AI Layer] SHQ-INTAKE-VALIDATOR runs validation
       ↓
[App Layer] Composio MCP Client validates via gateway
       ↓ (validation success)
[Data Layer - MIDDLE] Neon `clnt.clients_subhive_master`
       ↓
[AI Layer] VENDOR-EXPORT-AGENT transforms data
       ↓
[Data Layer - OUTPUT] Neon `vendor_output_mutualofomaha`
       ↓
[Data Layer - AUDIT] Neon `shq.audit_log` records all actions
```

---

## 🎯 Blueprint Versioning

Every intake record is tagged with:
- **blueprint_version**: Semantic version (e.g., "v1.0.0")
- **validator_signature**: Agent ID (e.g., "SHQ-INTAKE-VALIDATOR")
- **timestamp_last_touched**: ISO timestamp for audit trail

These fields are **enforced at the Firestore security rules layer** and **required for all company and employee documents**.

---

## 🧠 Agent Memory and Self-Documentation

This map serves as:
1. **Onboarding material** for new developers and agents
2. **Reference documentation** for architectural decisions
3. **Training data** for AI agents to understand the system structure
4. **Compliance documentation** showing adherence to Barton Doctrine

---

## 📊 Technology Stack Summary

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **UI** | React, TypeScript, Vite, TailwindCSS | User interface and interaction |
| **AI/Agent** | Claude, HEIR, MCP, Python | Validation, transformation, orchestration |
| **Application** | TypeScript, Node.js, FastAPI | Business logic and services |
| **Data** | Firebase, Neon (PostgreSQL), Composio | Storage and data management |
| **System** | MCP, Garage, IMO Registry, HEIR | Infrastructure and tooling |

---

## 🔍 Key Principles

1. **Vendor Neutrality**: Canonical schema is vendor-agnostic
2. **Blueprint-Driven**: All vendor exports use blueprint mappings
3. **Audit Everything**: All actions logged to `shq.audit_log`
4. **Version Everything**: Blueprint versioning on all intake records
5. **Validate Early**: Firebase validation before Neon promotion
6. **Agent-Driven**: Agents handle validation, transformation, and export
7. **HEIR Coordination**: Altitude-based agent hierarchy for complex tasks

---

## 📚 Related Documentation

- `README_AGENT_STRUCTURE.md` - Agent architecture and validation flows
- `EXAMPLES.md` - Sample payloads and validation examples
- `README-CLIENT-INTAKE.md` - Client intake wizard documentation
- `docs/TODO.md` - Project roadmap and completed items
