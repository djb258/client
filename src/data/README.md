# CTB/DATA - Data & Database

**Branch:** `data`
**Purpose:** Database schemas, migrations, data models, and storage systems

---

## 📁 Directory Structure

```
ctb/data/
├── db/                      # Database schemas and migrations
│   ├── neon/               # Neon PostgreSQL configuration
│   ├── registry/           # Registry data
│   │   └── clnt_column_registry.yml
│   └── vendor_blueprints/  # Vendor blueprint data
├── firebase/               # Firebase configuration
│   └── types/              # Firestore type definitions
│       └── firestore.ts
└── tests/                  # Data layer tests
    ├── test_schemas.py
    ├── test_migrations.py
    └── fixtures/
```

## 🗄️ Database Overview

### Supported Databases

1. **PostgreSQL (Neon)** - Primary relational database
2. **Firebase/Firestore** - Real-time document database
3. **Registry** - Column registry and metadata

### Database Connections

```bash
# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:pass@host:5432/database

# Firebase
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY=<private-key>

# Registry
REGISTRY_PATH=ctb/data/db/registry/
```

## 📊 Schemas

### PostgreSQL Schema Structure

```sql
-- Main Tables
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE blueprints (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    blueprint_type VARCHAR(50),
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE imo_processes (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER REFERENCES blueprints(id),
    input_stage JSONB,
    middle_stage JSONB,
    output_stage JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Registry Schema

**File:** `db/registry/clnt_column_registry.yml`

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

### Firebase Schema

**File:** `firebase/types/firestore.ts`

```typescript
// Firestore document types
interface Client {
  id: string;
  name: string;
  email: string;
  metadata: Record<string, any>;
  createdAt: FirebaseFirestore.Timestamp;
}

interface Blueprint {
  id: string;
  clientId: string;
  type: string;
  config: Record<string, any>;
  createdAt: FirebaseFirestore.Timestamp;
}
```

## 🔄 Migrations

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

## 🧪 Test Database

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

## 📝 Data Models

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

## 🔍 Querying Data

### PostgreSQL Queries

```python
import psycopg2

# Connect to database
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

# Query clients
cursor.execute("SELECT * FROM clients WHERE email = %s", (email,))
client = cursor.fetchone()

# Insert blueprint
cursor.execute("""
    INSERT INTO blueprints (client_id, blueprint_type, config)
    VALUES (%s, %s, %s)
    RETURNING id
""", (client_id, 'imo', config))
blueprint_id = cursor.fetchone()[0]
conn.commit()
```

### Firebase Queries

```typescript
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Query clients
const clientsRef = db.collection('clients');
const snapshot = await clientsRef.where('email', '==', email).get();

// Add blueprint
const blueprintRef = await db.collection('blueprints').add({
  clientId: client.id,
  type: 'imo',
  config: config,
  createdAt: FieldValue.serverTimestamp()
});
```

## 🧪 Testing

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

## 🔐 Environment Variables

Create `.env` file in `ctb/data/`:

```bash
# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_SIZE=10

# Firebase
FIREBASE_PROJECT_ID=client-subhive
FIREBASE_PRIVATE_KEY_PATH=/path/to/service-account.json

# Test Database
TEST_DATABASE_URL=postgresql://localhost/client_subhive_test

# Data Configuration
DATA_ENCRYPTION_KEY=<encryption-key>
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
```

See `.env.example` for complete configuration.

## 📊 Data Flow

```
┌──────────────────────────────────────┐
│         Application Layer            │
│  (CTB/UI, CTB/AI, CTB/SYS)          │
└───────────────┬──────────────────────┘
                │
┌───────────────▼──────────────────────┐
│         Data Access Layer            │
│  • ORM/Query Builder                 │
│  • Connection Pooling                │
│  • Transaction Management            │
└───────────────┬──────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼─────┐  ┌──────▼──────┐
│ PostgreSQL  │  │  Firebase    │
│   (Neon)    │  │ (Firestore)  │
└─────────────┘  └──────────────┘
```

## 🔄 Backup & Recovery

### Database Backups

```bash
# Backup PostgreSQL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20251023.sql

# Backup Firebase
firebase-tools database:get / > firebase_backup_$(date +%Y%m%d).json
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

## 📚 Documentation

- [Schema Definitions](db/schema.sql) - Complete schema
- [Migration Guide](migrations/README.md) - How to create migrations
- [Firebase Types](firebase/types/firestore.ts) - Type definitions
- [Test Fixtures](tests/fixtures/README.md) - Available test data

## 🔗 Quick Links

- **Schemas:** [db/schema.sql](db/schema.sql)
- **Migrations:** [migrations/](migrations/)
- **Registry:** [db/registry/](db/registry/)
- **Firebase:** [firebase/](firebase/)
- **Tests:** [tests/](tests/)

## 🐛 Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Test Firebase connection
firebase-tools projects:list
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
