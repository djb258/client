# CTB/DATA - Data & Database

**Branch:** `data`
**Purpose:** Database schemas, migrations, data models, and storage systems

---

## Directory Structure

```
src/data/
├── db/                      # Database schemas and migrations
│   ├── neon/               # Neon PostgreSQL configuration
│   └── registry/           # Column registry (single source of truth)
│       └── clnt_column_registry.yml
├── hub/                     # Hub accessor (read-only)
│   └── accessor.ts
├── spokes/                  # Spoke-level generated types and schemas
│   ├── s1-hub/
│   ├── s2-plan/
│   ├── s3-employee/
│   ├── s4-vendor/
│   └── s5-service/
├── ERD.md                   # Generated ERD (DO NOT HAND-EDIT)
└── tests/                   # Data layer tests
    └── test_schemas.py
```

## Database Overview

### Database Platform

1. **PostgreSQL (Neon)** - Primary relational database (sole permitted platform)
2. **Registry** - Column registry and metadata

### Database Connections

All secrets are managed via Doppler. No .env files permitted.

```bash
# PostgreSQL (Neon) — accessed via Doppler
doppler run -- <command>
# Secret: NEON_DATABASE_URL

# Registry
REGISTRY_PATH=ctb/data/db/registry/
```

## Schemas

### PostgreSQL Schema Structure (clnt schema)

The canonical schema is `clnt` with 16 tables across 5 spokes.
See `src/data/db/registry/clnt_column_registry.yml` for the single source of truth.

### Registry Schema

**File:** `src/data/db/registry/clnt_column_registry.yml`

```yaml
# Column Registry for Client Data
tables:
  clients:
    columns:
      - name: id
        type: serial
        primary_key: true
      - name: name
        type: varchar(255)
        nullable: false
      - name: email
        type: varchar(255)
        unique: true
```

## Migrations

### Running Migrations

```bash
# Run all pending migrations
cd ctb/data
python migrations/migrate.py

# Rollback last migration
python migrations/migrate.py --rollback

# Create new migration
python migrations/create.py "add_user_roles_table"
```

### Migration Files

```
migrations/
├── 001_initial_schema.sql
├── 002_add_blueprints.sql
├── 003_add_imo_processes.sql
└── 004_add_indexes.sql
```

### Migration Template

```sql
-- Migration: add_user_roles_table
-- Created: 2025-10-23

BEGIN;

CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clients(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

COMMIT;
```

## Test Database

### Setup Test Database

```bash
# Create test database
createdb client_subhive_test

# Run migrations on test DB
DATABASE_URL=postgresql://localhost/client_subhive_test \
  python migrations/migrate.py

# Seed test data
python tests/seed_test_data.py
```

### Test Data Fixtures

```bash
# Load fixtures
cd ctb/data/tests
python -m pytest --fixtures

# Available fixtures:
# - test_client
# - test_blueprint
# - test_process
```

## Data Models

### Client Model

```python
# Example data model
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Client:
    id: int
    name: str
    email: str
    created_at: datetime

    @classmethod
    def from_db(cls, row):
        return cls(
            id=row['id'],
            name=row['name'],
            email=row['email'],
            created_at=row['created_at']
        )
```

### Blueprint Model

```python
@dataclass
class Blueprint:
    id: int
    client_id: int
    blueprint_type: str
    config: dict
    created_at: datetime

    def to_json(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'type': self.blueprint_type,
            'config': self.config
        }
```

## Querying Data

### Neon Queries (via Gatekeeper)

All database access must go through the gatekeeper module at `src/sys/modules/gatekeeper/`.

```python
# All queries route through gatekeeper — direct DB client imports are banned.
# Connection string provided by Doppler: NEON_DATABASE_URL
```

## Testing

### Run Data Tests

```bash
cd ctb/data/tests

# Run all data tests
python -m pytest

# Run specific test file
python -m pytest test_schemas.py
python -m pytest test_migrations.py

# Run with coverage
pytest --cov=ctb/data --cov-report=html
```

### Test Structure

```python
# test_schemas.py
def test_client_schema(test_db):
    """Test client table schema"""
    client = create_test_client()
    assert client.id is not None
    assert client.email is not None

def test_blueprint_creation(test_db):
    """Test blueprint creation"""
    blueprint = create_test_blueprint()
    assert blueprint.config is not None
```

## Environment Variables

All secrets are managed via Doppler. No .env files permitted.

```bash
# PostgreSQL (Neon) — via Doppler
# NEON_DATABASE_URL=postgresql://user:password@host:5432/database

# Test Database
# TEST_DATABASE_URL=postgresql://localhost/client_subhive_test
```

## Data Flow

```
┌──────────────────────────────────────┐
│         Application Layer            │
│  (CTB/UI, CTB/AI, CTB/SYS)          │
└───────────────┬──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│         Data Access Layer            │
│  • Gatekeeper Module                 │
│  • Connection Pooling                │
│  • Transaction Management            │
└───────────────┬──────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼─────┐         │
│ PostgreSQL  │         │
│   (Neon)    │         │
└─────────────┘         │
```

## Backup & Recovery

### Database Backups

```bash
# Backup PostgreSQL
pg_dump $NEON_DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $NEON_DATABASE_URL < backup_20251023.sql
```

### Automated Backups

Configured in `global-config.yaml`:

```yaml
data:
  backup:
    enabled: true
    schedule: "0 2 * * *"  # Daily at 2 AM
    retention_days: 30
    storage: "s3://backups/client-subhive"
```

## Documentation

- [Schema Definitions](db/schema.sql) - Complete schema
- [Migration Guide](migrations/README.md) - How to create migrations
- [Test Fixtures](tests/fixtures/README.md) - Available test data

## Quick Links

- **Schemas:** [db/schema.sql](db/schema.sql)
- **Migrations:** [migrations/](migrations/)
- **Registry:** [src/data/db/registry/](db/registry/)
- **Tests:** [tests/](tests/)

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql $NEON_DATABASE_URL -c "SELECT 1"
```

### Migration Failures

```bash
# Check migration status
python migrations/status.py

# Force rollback
python migrations/migrate.py --rollback --force

# Re-run failed migration
python migrations/migrate.py --retry
```

### Data Integrity Issues

```bash
# Check for orphaned records
python scripts/check_integrity.py

# Fix foreign key violations
python scripts/fix_references.py
```

---

**Last Updated:** 2025-10-23
**Maintained By:** CTB Data System
**Version:** 1.0.0
