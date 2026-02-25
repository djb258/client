# Client Intake & Vendor Export System

**Hub ID:** `client-subhive`
**Parent Sovereign:** [imo-creator](https://github.com/djb258/imo-creator)
**Doctrine Version:** 3.4.1

---

## Purpose

This hub manages the intake of client data, transforms it into a canonical schema stored in Neon PostgreSQL, and exports to vendor-specific formats.

**Transformation:** Raw client intake data (companies, employees, benefit elections, renewal quotes) into canonical Neon records and vendor-specific export files.

---

## Architecture

- **Schema:** `clnt` (16 tables, 5 spokes)
- **Database:** Neon PostgreSQL
- **Spine Table:** `clnt.client` (UUID `client_id`)
- **Registry:** `src/data/db/registry/clnt_column_registry.yml`

### Spokes

| Spoke | Domain | Tables |
|-------|--------|--------|
| S1 Hub | Client identity | client, client_error |
| S2 Plan | Benefit plans | plan, plan_error, plan_quote |
| S3 Employee | Employee identity | person, employee_error, election, enrollment_intake, intake_record |
| S4 Vendor | Vendor identity | vendor, vendor_error, external_identity_map, invoice |
| S5 Service | Service tickets | service_request, service_error |

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure secrets (Doppler required)
doppler setup

# Run codegen from registry
doppler run -- npx ts-node scripts/codegen-schema.ts

# Start development server
doppler run -- npm run dev
```

---

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run codegen` | Generate TypeScript from column registry |
| `npm run codegen:verify` | Verify generated files match registry |
| `bash scripts/ctb-registry-gate.sh` | Registry vs migrations validation |
| `bash scripts/ctb-drift-audit.sh` | 3-surface drift detection |
| `bash scripts/detect-banned-db-clients.sh` | Check for banned DB client imports |

---

## Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | AI bootstrap guide |
| `DOCTRINE.md` | Doctrine adherence |
| `docs/prd/PRD.md` | Product requirements |
| `docs/CTB_GOVERNANCE.md` | Table registry and governance |
| `doctrine/OSAM.md` | Semantic access map |

---

## Secrets

All runtime configuration sourced via **Doppler**. No `.env` files permitted.

| Secret | Purpose |
|--------|---------|
| `NEON_DATABASE_URL` | Database connection |
| `HUB_ID` | Hub identifier |

See `integrations/DOPPLER.md` for full setup.

---

**Version:** 3.4.1 | **Last Updated:** 2026-02-25
