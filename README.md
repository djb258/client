# Client Subhive (Vault + Workbench)

- **Vault (Neon, schema `clnt`)**: company, employee, vendor linkage, benefits, tiers, enrollments, output blueprints, vendor-specific output tables.
- **Workbench (Firebase)**: intake, validation, queueing

---

## Architecture

This repository contains the **Client SubHive** system following the Barton Doctrine (IMO + ORBT):
- **Input Layer**: Manual intake wizard (Firebase Workbench)
- **Middle Layer**: Canonical schema (Neon `clnt` schema)
- **Output Layer**: Vendor-specific tables built from blueprints

## Directory Structure

```
client-subhive/
├── db/
│   ├── neon/                    # Neon database schema and migrations
│   │   ├── 01_schema.sql        # Core tables: company, employee, vendor_linkage, etc.
│   │   ├── 02_views.sql         # Convenience views
│   │   ├── 03_seed.sql          # Sample data (dev/test)
│   │   └── MIGRATE.md           # Migration guide
│   ├── registry/
│   │   └── clnt_column_registry.yml  # Column registry for canonical schema
│   └── vendor_blueprints/       # Vendor mapping configurations
│       ├── mutual_of_omaha.mapping.json
│       └── guardian_life.mapping.json
├── firebase/                    # Firebase Workbench configuration
│   ├── firestore.rules          # Security rules
│   ├── firestore.indexes.json   # Query indexes
│   └── model.md                 # Firestore data model
├── scripts/                     # Utility scripts
│   ├── run_migrations_via_mcp.ts      # Run migrations through Composio MCP
│   ├── run_vendor_export.ts           # Export to vendor tables
│   └── validate_registry.ts           # Validate registry against Neon
├── composio.config.json         # Composio MCP endpoint configuration
└── .env.example                 # Environment variables template
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run Migrations
```bash
npm run migrate
```

### 4. Validate Registry
```bash
npm run registry:validate
```

### 5. Export to Vendor
```bash
npm run export:run mutual_of_omaha
npm run export:run guardian_life [company_id]
```

## Key Features

- **Vault (Neon)**: Canonical storage for all client and employee data
- **Workbench (Firebase)**: Staging area for intake, validation, and queueing
- **Composio MCP Gateway**: All Neon writes go through validation endpoints
- **Vendor Blueprints**: Dynamic mapping from canonical schema to vendor-specific formats
- **Column Registry**: YAML-based schema documentation and validation

## OR BT System Responsibility

All processes, updates, and maintenance for this repository are managed by the **OR BT system** (Operational Repair, Build, Troubleshooting/Training).

---

For detailed documentation, see individual files and directories. 