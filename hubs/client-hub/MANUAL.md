# Client Hub
## Client-subhive CRUD worker for the client registry, enrollment, vendor, invoice, and service spokes.
### Status: BUILD
### Medium: worker
### Business: imo-creator

---

# IDENTITY (Thing — what this IS)

_Everything in this cluster answers: what exists? These are constants that don't change regardless of who reads this or when._

## 1. IDENTITY

| Field | Value |
|-------|-------|
| ID | client-hub |
| Name | Client Hub Worker |
| Medium | worker (Cloudflare Worker — Hono + TypeScript) |
| Business Silo | imo-creator / client-subhive |
| CTB Position | leaf -> workers/client-hub |
| ORBT | BUILD |
| Strikes | 0 |
| Authority | inherited — imo-creator (CC-01) |
| Last Modified | 2026-04-12 |
| BAR Reference | none |

### HEIR (8 fields — Aviation Model, Bedrock S8)

| Field | Value |
|-------|-------|
| sovereign_ref | imo-creator |
| hub_id | client-hub |
| ctb_placement | leaf |
| imo_topology | middle (HTTP CRUD hub backed by D1) |
| cc_layer | CC-03 context |
| services | Cloudflare Workers, D1 SQLite, Hono router |
| secrets_provider | doppler (Cloudflare deploy token) |
| acceptance_criteria | All five spoke route groups respond, migration creates the 11 missing tables, D1 binding is live, and /health returns 200 |

### Worker Fill Rule
Identity must match the real worker and sit at `leaf -> workers/client-hub`.

### Cross-reference
- `workers/client-hub/wrangler.toml`
- `workers/client-hub/src/index.ts`
- `workers/client-hub/migrations/0001_create_tables.sql`

**0 -> 1 when:** worker metadata, bindings, and placement match the checked-in code and deployment config.

## 2. PURPOSE

_What breaks without it. What business outcome it serves. If you can't answer this, it shouldn't exist._

Client Hub exposes the client-subhive data model as a single edge API organized by spoke. Without it, the client registry has schema definitions but no deployable CRUD surface for client identity, plan data, enrollment records, vendor billing, or service requests, and the D1 database remains only partially materialized.

### Worker Fill Rule
State the worker's business outcome, who starves without it, and the operational risk if it fails.

### Cross-reference
- `workers/client-hub/src/routes/`
- `workers/client-hub/migrations/0001_create_tables.sql`

**0 -> 1 when:** the purpose stays at the business/API level and names the dependency on the client D1 workspace.

## 3. RESOURCES

_Everything this depends on. A mechanic reads this and knows exactly what to set up before it can run._

### Dependencies

| Dependency | Type | What It Provides | Status |
|-----------|------|-----------------|--------|
| D1: client-hub (`binding = DB`) | database | Canonical and error tables for all five client spokes | DONE |
| Hono | library | HTTP router and per-spoke route composition | DONE |
| TypeScript | toolchain | Static checking for route and env code | DONE |
| Wrangler | deploy/runtime tool | Local dev, D1 migration execution, deployment | DONE |
| Column registry (`clnt_column_registry.yml`) | schema source | Exact column names, type intent, FK/check semantics | DONE |

### Downstream Consumers

| Consumer | What It Needs |
|----------|--------------|
| Mission Control / future client UI | CRUD endpoints grouped by spoke |
| Back-office operations | D1-backed writes for enrollment, vendor, invoice, and service workflows |
| Deployment operator | `/health` and `wrangler deploy` for runtime verification |

### Tools & Integrations

| Item | Type | Cost Tier | Credentials | What It Does |
|------|------|-----------|-------------|-------------|
| Cloudflare Workers | edge runtime | usage-based | Cloudflare account | Runs the Hono worker |
| D1 SQLite | database | usage-based | D1 binding | Stores client-hub spoke tables |
| Doppler CLI | secret provider | paid | `GLOBAL_CLOUDFLARE_API_TOKEN` | Supplies deploy token for Wrangler |

### Secrets

| Secret | Doppler Project | Config | Used By |
|--------|----------------|--------|---------|
| GLOBAL_CLOUDFLARE_API_TOKEN | imo-creator | dev | `wrangler deploy` and remote D1 migration |

### Worker Fill Rule
Inventory every binding class, secret, trigger, upstream dependency, and downstream consumer; absent classes must be explicit `none`.

### Cross-reference
- `workers/client-hub/wrangler.toml`
- `workers/client-hub/package.json`

**0 -> 1 when:** D1, secret flow, and runtime toolchain are all named and no required binding is omitted.

---

# CONTRACT (Flow — what flows through this)

_Everything in this cluster answers: what moves? How does data/work enter, get processed, and exit?_

## 4. IMO — Input, Middle, Output

### Two-Question Intake (Bedrock S3)
1. **"What triggers this?"** — HTTP requests to `/health` or a spoke CRUD endpoint.
2. **"How do we get it?"** — Cloudflare Workers fetch handler via Hono route matching.

### Input
HTTP JSON requests targeting one of the spoke/table endpoints. `POST` and `PUT` bodies carry row fields. `GET` supports `limit` and `offset` for list routes.

### Middle
The worker routes each request into a table-specific CRUD adapter, serializes JSON fields, executes parameterized SQL through the `DB` binding, and returns JSON responses.

| Step | Input | What Happens | Output | Tool Used |
|------|-------|-------------|--------|-----------|
| 1 | Request path | Hono matches `/health` or `/api/s*/...` | Route selection | Hono |
| 2 | CRUD request | Shared CRUD helper resolves table config | SQL statement + bindings | `src/lib/crud.ts` |
| 3 | SQL statement | D1 executes select/insert/update/delete | row set or mutation result | D1 |
| 4 | D1 result | JSON fields are parsed for response payloads | JSON response | Hono |

### Output
JSON payloads for list, record fetch, create, update, delete, and health check operations.

### Circle (Bedrock S5)
Request enters a spoke route -> CRUD helper writes or reads D1 -> caller receives structured JSON -> caller decides next operation -> subsequent requests continue against the same canonical row IDs.

### Worker Fill Rule
Document the worker as trigger/request -> process -> response, with worker code as hub and routes/triggers as spokes.

### Cross-reference
- `workers/client-hub/src/index.ts`
- `workers/client-hub/src/lib/crud.ts`

**0 -> 1 when:** the route-to-D1 execution chain is explicit and maps to the checked-in code.

## 5. DATA SCHEMA

_Where the data lives. What's read, written, joined._

### READ Access

| Source | What It Provides | Join Key |
|--------|-----------------|----------|
| D1 `client-hub` | Existing tables: `client`, `client_error`, `plan`, `plan_error`, `plan_quote` | `client_id`, `plan_id` |
| D1 `client-hub` | New tables: `person`, `employee_error`, `election`, `enrollment_intake`, `intake_record`, `vendor`, `vendor_error`, `external_identity_map`, `invoice`, `service_request`, `service_error` | table-specific PKs + `client_id` |
| Column registry YAML | Canonical schema definitions for the client-subhive | table name |

### WRITE Access

| Target | What It Writes | When |
|--------|---------------|------|
| `person`, `vendor`, `service_request` | Canonical spoke records | POST/PUT/DELETE |
| `*_error` tables | Error records | POST/DELETE and optional admin corrections |
| Support/staging tables | Elections, intake batches, intake payloads, vendor mappings, invoices | POST/PUT/DELETE |
| `MANUAL.md` / migration / source | Worker implementation and deployment config | build time |

### Join Chain

`client` is the sovereign join key root. `person`, `vendor`, `invoice`, `service_request`, and all error tables join through `client_id`. `election` joins `person` -> `plan`. `intake_record` joins `enrollment_intake`. `external_identity_map` joins `vendor` and points to internal IDs.

### Forbidden Paths

| Action | Why |
|--------|-----|
| Recreating `client`, `client_error`, `plan`, `plan_error`, `plan_quote` in the migration | Those five tables already exist |
| Writing outside `workers/client-hub/` | Task safety boundary |
| Mutating locked doctrine constants | Human-only system constants |

## 6. DMJ — Define, Map, Join

_Three steps. In order. Can't skip._

### 6a. DEFINE (Build the Key)

| Element | ID | Format | Description | C or V |
|---------|-----|--------|-------------|--------|
| D1 binding | DB-01 | `DB` | Cloudflare D1 handle for the worker | C |
| Spoke route | ROUTE-01..05 | `/api/sN/...` | Five route groups for client, plan, person, vendor, service | C |
| Table config | TBL-01..14 | `{ name, pk, jsonColumns }` | CRUD metadata for each table route | V |
| Health route | HEALTH-01 | `/health` | Runtime connectivity check | C |
| Migration | MIG-0001 | SQL file | Creates the 11 missing tables only | C |

### 6b. MAP (Connect Key to Structure)

| Source | Target | Transform |
|--------|--------|-----------|
| Column registry | D1 migration | SQL tables, checks, FK references adapted to SQLite types |
| Table config | CRUD router | Per-table Hono subrouter |
| `wrangler.toml` D1 binding | `Env.DB` | Runtime binding injection |
| HTTP method + path | SQL action | GET=list/read, POST=create, PUT=update, DELETE=delete |

### 6c. JOIN (Path to Spine)

| Join Path | Type | Description |
|-----------|------|-------------|
| `client_id` | Direct | Universal join key across the client-subhive |
| `person_id -> election.plan_id` | Direct | Employee election bridge |
| `vendor_id -> invoice` | Direct | Vendor billing chain |
| `enrollment_intake_id -> intake_record` | Direct | Batch header to raw intake record chain |

## 7. CONSTANTS & VARIABLES

### Constants (structure — never changes)

| Constant | Value |
|----------|-------|
| Runtime | Cloudflare Worker using Hono |
| D1 binding name | `DB` |
| Account ID | `a1dd98c646e8d2f4ae6f1ca6c0b79653` |
| Database ID | `3ba426ee-f9ed-4b76-958e-4001468bd847` |
| Route pattern | `client-hub.svg-outreach.workers.dev` |
| Spoke groups | `s1/client`, `s2/plan`, `s3/person`, `s4/vendor`, `s5/service` |

### Variables (fill — changes every task)

- Row payloads sent in `POST` and `PUT`
- Query params `limit` and `offset`
- Remote database contents after migration and runtime writes
- Cloudflare API token supplied at deploy time

## 8. STOP CONDITIONS

| Condition | Action |
|-----------|--------|
| D1 binding missing or misnamed | HALT — fix `wrangler.toml` before deploy |
| Migration attempts to recreate existing tables | REFUSE — keep migration scoped to the 11 missing tables |
| Request body is empty on create/update | Return `400` |
| Record does not exist on read/update/delete | Return `404` |
| Deploy token unavailable | HALT deploy and report blocker |

---

# GOVERNANCE (Change — how this is controlled)

_Everything in this cluster answers: what transforms? How is quality measured, verified, certified?_

## 9. VERIFICATION

_Executable proof that it works. Run these._

1. `npm install`
2. `npm run typecheck`
3. `npx wrangler d1 execute client-hub --remote --file=migrations/0001_create_tables.sql`
4. `npx wrangler deploy`
5. `curl https://client-hub.svg-outreach.workers.dev/health`

**Three Primitives Check**
1. **Thing:** worker files exist under `workers/client-hub/`.
2. **Flow:** requests route through Hono to D1.
3. **Change:** migration creates the missing tables without touching the existing five.

## 10. ANALYTICS

### 10a. Metrics

| Metric | Unit | Baseline | Target | Tolerance |
|--------|------|----------|--------|-----------|
| Typecheck pass rate | % | BASELINE | 100% | 0 |
| Health check success | status | BASELINE | 200 / `ok` | 0 |
| CRUD coverage | table routes | BASELINE | 14/14 tables exposed | 0 |
| Migration completeness | tables created | BASELINE | 11/11 | 0 |

### 10b. Sigma Tracking

| Metric | Run 1 | Run 2 | Run 3 | Trend | Action |
|--------|-------|-------|-------|-------|--------|
| Typecheck | pending | pending | pending | PENDING | populate after repeated runs |
| Health | pending | pending | pending | PENDING | populate after deploys |

### 10c. ORBT Gate Rules

| From | To | Gate |
|------|-----|------|
| BUILD | OPERATE | Migration applied, deploy succeeds, `/health` responds 200, spoke CRUD verified |
| OPERATE | REPAIR | D1 route or CRUD regression |
| REPAIR | OPERATE | fix + redeploy + re-verify |

## 11. EXECUTION TRACE

_Append-only. Every action logged. The auditor reads this._

| Field | Format | Required |
|-------|--------|----------|
| trace_id | UUID | Yes |
| run_id | UUID | Yes |
| step | action name | Yes |
| target | measurable | Yes |
| actual | measurable | Yes |
| delta | the gap | Yes |
| status | done / failed / skipped | Yes |
| error_code | text or null | If failed |
| error_message | text or null | If failed |
| tools_used | JSON array | Yes |
| duration_ms | integer | Yes |
| cost_cents | integer | Yes |
| timestamp | ISO-8601 | Yes |
| signed_by | agent or manual | Yes |

## 12. LOGBOOK (After Certification Only)

_Created ONLY when the worker is certified OPERATE. Append-only._

### Birth Certificate

| Field | Value |
|-------|-------|
| heir_ref | client-hub / leaf / CC-03 |
| orbt_entered | BUILD |
| orbt_exited | pending |
| action | pending certification |
| gates_passed | pending |
| signed_by | pending auditor |
| signed_at | pending |

## 13. FLEET FAILURE REGISTRY

| Pattern ID | Location | Error Code | First Seen | Occurrences | Strike Count | Status |
|-----------|----------|-----------|-----------|-------------|-------------|--------|
| — | — | — | — | — | — | No failures registered |

## 14. SESSION LOG

| Date | What Was Done | LBB Record |
|------|---------------|-----------|
| 2026-04-12 | Built `client-hub` worker scaffold, generated migration for the 11 missing tables, added five spoke route groups, and authored the worker manual. | pending |

## Document Control

| Field | Value |
|-------|-------|
| Created | 2026-04-12 |
| Last Modified | 2026-04-12 |
| Version | 1.0.0 |
| Template Version | 1.0.0 |
| Medium | worker |
| Derived From | `law/UNIFIED_TEMPLATE.md` |
| US Validated | pending |
| Governing Engine | `AGENTS.md` + `law/doctrine/FOUNDATIONAL_BEDROCK.md` |
