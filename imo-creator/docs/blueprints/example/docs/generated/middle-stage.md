# Middle Bucket - Detailed Documentation

## Stages

### 1. What value we add

**Key:** `frame`
**Kind:** frame

**Fields:**
- **one_liner:** Normalize + validate to canonical shape

**Required Fields:**
- one_liner

---

### 2. States & owners

**Key:** `state_machine`
**Kind:** what

**Fields:**
- **states:** ['transform', 'validate']
- **start:** transform
- **terminal:** ['validate']
- **owners:** ['backend']

**Required Fields:**
- states
- start
- terminal

---

### 3. Validation gates & invariants

**Key:** `gates`
**Kind:** contract

**Fields:**
- **gates:** ['email_valid']
- **invariants:** []
- **approvals:** []

**Required Fields:**
- gates

---

### 4. Transform / enrich (idempotent)

**Key:** `transform`
**Kind:** steps

**Fields:**
- **steps:** ['map_columns', 'normalize_email']
- **lookups:** []
- **retries:** {'max': 3, 'backoff': 'exponential'}
- **timeout_ms:** 120000
- **budget_usd:** 5

**Required Fields:**
- steps

---

### 5. Fixtures & simulator

**Key:** `tests`
**Kind:** tests

**Fields:**
- **fixtures:** ['happy', 'negative']
- **asserts:** ['pass', 'fail']

**Required Fields:**
- fixtures
- asserts

---

### 6. Stage to working store + events

**Key:** `staging`
**Kind:** wire

**Fields:**
- **working_store:** neon (later)
- **write_kind:** upsert
- **document_keys:** ['natural_key']
- **events:** ['middle.step.start', 'middle.step.done', 'middle.step.error']

**Required Fields:**
- working_store
- events

---

