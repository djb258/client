# Output Bucket - Detailed Documentation

## Stages

### 1. Who gets what (and why now)

**Key:** `frame`
**Kind:** frame

**Fields:**
- **one_liner:** Publish clean roster to dashboard + file export

**Required Fields:**
- one_liner

---

### 2. Destinations & consumers

**Key:** `destinations`
**Kind:** what

**Fields:**
- **destinations:** ['dashboard:view roster']
- **consumers:** ['Ops']
- **side_effects:** []

**Required Fields:**
- destinations

---

### 3. Output schema, promotion gate, audit

**Key:** `promotion`
**Kind:** contract

**Fields:**
- **schema_ref:** docs/schemas/example_output.schema.json
- **promotion_gate:** validator.status=='pass'
- **audit:** ['run_id', 'hash', 'actor']

**Required Fields:**
- schema_ref
- promotion_gate
- audit

---

### 4. UPSERT, notifications, retention, events

**Key:** `publish`
**Kind:** steps

**Fields:**
- **upsert_rule:** ON CONFLICT (natural_key) DO UPDATE
- **notifications:** []
- **retention:** P30D
- **events:** ['output.promoted', 'notify.sent']

**Required Fields:**
- upsert_rule
- events

---

