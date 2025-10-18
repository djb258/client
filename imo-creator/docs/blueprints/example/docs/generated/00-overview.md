# Example - Overview

**Version:** 1.0.0
**Generated:** 2025-10-18 11:57:44

## Mission

**North Star:** Prove the Blueprint app shell end-to-end.

**Success Metrics:**
- Planâ†’Scaffold under 10m
- Sim passes idempotency
- Publish dry-run ok

**Constraints:**
- No external DB yet
- Static UI


## Architecture

This blueprint follows the IMO (Input-Middle-Output) pattern with 3 primary buckets:

### Input Bucket

**Stages:** 5

- **What do we accept/reject?** (frame)
- **Sources, triggers, prechecks** (what)
- **Input schema & idempotency** (contract)
- **Intake steps & params** (steps)
- **Examples & acceptance** (tests)

### Middle Bucket

**Stages:** 6

- **What value we add** (frame)
- **States & owners** (what)
- **Validation gates & invariants** (contract)
- **Transform / enrich (idempotent)** (steps)
- **Fixtures & simulator** (tests)
- **Stage to working store + events** (wire)

### Output Bucket

**Stages:** 4

- **Who gets what (and why now)** (frame)
- **Destinations & consumers** (what)
- **Output schema, promotion gate, audit** (contract)
- **UPSERT, notifications, retention, events** (steps)

