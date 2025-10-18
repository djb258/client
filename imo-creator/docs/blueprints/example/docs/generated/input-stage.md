# Input Bucket - Detailed Documentation

## Stages

### 1. What do we accept/reject?

**Key:** `one_liner`
**Kind:** frame

**Fields:**
- **one_liner:** Accept roster CSV; reject malformed/oversized

**Required Fields:**
- one_liner

---

### 2. Sources, triggers, prechecks

**Key:** `sources`
**Kind:** what

**Fields:**
- **sources:** ['CSV upload']
- **triggers:** ['manual']
- **prechecks:** ['size<50MB']
- **trust_boundary:** Internetâ†’Garage

**Required Fields:**
- sources

---

### 3. Input schema & idempotency

**Key:** `contract`
**Kind:** contract

**Fields:**
- **schema_ref:** docs/schemas/example_input.schema.json
- **idempotency_key:** {file_sha256}

**Required Fields:**
- schema_ref
- idempotency_key

---

### 4. Intake steps & params

**Key:** `intake_steps`
**Kind:** steps

**Fields:**
- **steps:** ['ingest', 'validate_shape']
- **retries:** {'max': 3, 'backoff': 'exponential'}
- **timeout_ms:** 60000
- **limits:** {'qps': None}

**Required Fields:**
- steps

---

### 5. Examples & acceptance

**Key:** `fixtures`
**Kind:** tests

**Fields:**
- **fixtures:** ['good.csv', 'bad.csv']
- **asserts:** ['accepted', 'rejected']

**Required Fields:**
- fixtures
- asserts

---

