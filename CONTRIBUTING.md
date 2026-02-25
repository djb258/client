# Contributing to Client Intake & Vendor Export System

## Prerequisites

- Node.js 18+
- Doppler CLI (secrets management)
- PostgreSQL client (for migrations)

## Setup

```bash
git clone https://github.com/djb258/client.git
cd client
npm install
doppler setup
```

## Development Workflow

1. **Register first** — Any new table must be registered in `src/data/db/registry/clnt_column_registry.yml` before creation
2. **ADR required** — Schema changes require an Architecture Decision Record in `docs/adr/`
3. **Run codegen** — After registry changes: `npm run codegen`
4. **Verify** — Before committing: `npm run codegen:verify`

## Commit Style

Use conventional commits:

- `feat:` New feature or capability
- `fix:` Bug fix
- `chore:` Maintenance, dependency updates, template sync
- `docs:` Documentation only

## Architecture Rules

- All database access through `src/sys/modules/gatekeeper/` (no direct DB clients)
- Secrets via Doppler only (no `.env` files)
- UI owns no schema, no persistence, no business logic
- Code lives in CTB branches: `src/sys/`, `src/data/`, `src/app/`, `src/ai/`, `src/ui/`

## Key Documents

- `CLAUDE.md` — Full developer guide
- `docs/prd/PRD.md` — Product requirements and scope
- `docs/CTB_GOVERNANCE.md` — Table governance rules
