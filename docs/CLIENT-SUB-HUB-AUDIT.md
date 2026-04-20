# CLIENT-SUB-HUB Audit
## FAA Inspector audit of the Client Sub-Hub UT document against `law/UNIFIED_TEMPLATE.md` and `law/UT_CHECKLIST.md`
### Audit Date: 2026-04-16
### Auditor: Codex (AUDITOR role)
### Subject: `/Users/employeeai/Documents/client/docs/CLIENT-SUB-HUB.md`
### Checklist Sources:
- `law/UT_CHECKLIST.md`
- `law/UNIFIED_TEMPLATE.md`

---

## Section Audit

| Section | Status | Findings |
|---|---|---|
| §1 Identity (+ §1b Geometry) | PROVISIONAL | Present at lines 39-85. Identity table includes all template fields, including `Owner` at line 53. Geometry subsection exists with CTB Position, Hub-Spoke Role, Altitude, and Mermaid diagram at lines 55-72. HEIR table exists at lines 74-85. Non-conformance: altitude is expressed as a range (`10k operational through 5k execution`) rather than one template slot value at line 61. |
| §2 Purpose / PRD | PROVISIONAL | Present at lines 89-136 and includes WHAT, WHY, WHO, SCOPE, OUT-OF-SCOPE, SUCCESS METRIC. Content is structurally conformant. Non-conformance: SUCCESS METRIC does not point back to §10a as the template requires; it is free text only at line 136. |
| §3 Resources (+ §3c, §3d, §3e) | FAIL | Present at lines 140-220. Cross-ref tables do carry HEIR+ORBT columns in §3 Component Status Grid, §3c, §3d, and §3e (lines 146, 203, 210, 217). Failures: 1. Component Status Grid does not include every dependency listed in `### Dependencies`; `Dashboard layer` and `Employee self-serve page` appear in Dependencies at lines 170-171 but not in the grid at lines 148-152, which violates UT Checklist item 3. 2. Live Dashboard table is not valid for a checked box because `Per-client dashboards` uses `[PENDING — BAR-82 in progress]` instead of a URL or explicit `N/A` at line 160; UT Checklist item 5 disallows placeholder status. 3. §3c contains unresolved placeholders in required fields: `FCE-008 SVG Outreach` has `[PENDING]` in HEIR, Run Directory, Latest P=1, and Rows at line 206. 4. §3d BAR statuses are listed as `In Progress` at lines 212-213, but the corresponding live verification rows are unchecked at lines 582-583, so the status claim is not grounded. 5. FP-001 is explicitly documented here: `svg-d1-client not yet bound` appears in the worker state at line 148 and the D1 row at line 150. |
| §4 IMO | PASS | Present at lines 228-265. Two-question intake, Input, Middle table, Output, and Circle are all present and in template order. No missing fields observed. |
| §5 OSAM | FAIL | Present at lines 269-406 and includes READ Access, WRITE Access, Process Composition, Join Chain, Forbidden Paths, and Query Routing. Failures: 1. The section documents and routes through a `client` table repeatedly at lines 275, 297, 340, and 560-562, while §13 records FP-002 that the migration set has no `CREATE TABLE client` statement at lines 662-665. That is an internal inconsistency inside the UT. 2. Process Composition has a `[PENDING]` Process ID for Orchestrator at line 335. 3. The schema gap block confirms additional missing structures at lines 397-404. 4. FP-001 is also carried forward here via the consolidation note: `client-hub worker is only bound to the client-hub D1, making svg-d1-client a dangling asset` at line 406. |
| §6 DMJ | FAIL | Present at lines 410-464 with DEFINE, MAP, and JOIN subsections. Failure: `service_status` is defined as `ENUM (open, closed, routed)` but classified as `V` at line 428. Under the KEY and template logic, the enum structure is a constant, so this row is internally inconsistent. |
| §7 Constants & Variables | FAIL | Present at lines 468-493. Structure is present, but content mixes mutable state into constants. Example: `Two databases ... status: currently diverged, pending consolidation` is listed under Constants at line 482 even though `currently diverged` and `pending consolidation` are variable state, not immutable structure. |
| §8 Stop Conditions + Kill Switch | PROVISIONAL | Present at lines 497-530. Stop Conditions table exists. `### Kill Switch` exists. Non-conformance: the kill switch block mixes executable commands with non-command/manual guidance, including `Navigate to CF Dashboard ... Delete` at lines 518-519, which does not satisfy the UT Checklist requirement for an exact executable command only. `Option 3` at lines 521-522 is an inspect query, not a stop action. |
| §9 Verification + §9b Live Verification | PROVISIONAL | Present at lines 538-587. Verification steps and Three Primitives Check exist. §9b table exists with required columns. Section remains provisional because multiple live-verification rows are unchecked at lines 576, 579, 582-585, and the rule at line 587 explicitly says unchecked rows block certification. FP-001 is grounded here at line 581 (`svg-d1-client NOT bound to worker`). |
| §10 Analytics | PROVISIONAL | Present at lines 591-617. Metrics, Sigma Tracking, and ORBT Gate Rules exist. Pending items requiring Dave input remain in Metrics: `Service request open-to-close rate` target and tolerance are `[PENDING — needs Dave input on SLA]` / `[PENDING]` at line 600. Sigma table is also still baseline-only at lines 607-608. |
| §11 Execution Trace | PASS | Present at lines 621-640. Template field table exists and is structurally conformant. Note at line 640 says explicit trace table is future work, but the section itself is present and complete as a UT spec section. |
| §12 Logbook | PASS | Present at lines 644-653. For ORBT=`BUILD`, the template explicitly allows no logbook yet. This section is conformant as a pre-certification placeholder. Checklist item 7 remains legitimately unchecked. |
| §13 Fleet Failure Registry | PASS | Present at lines 657-667. FP-001 and FP-002 are both explicitly documented at lines 661-665. FP-001: `svg-d1-client not bound to worker`. FP-002: `client-hub D1 has no client table (migration references client FK but no client CREATE)`. The explanatory note on FP-002 is also present at line 665. |
| §14 Maintenance Logbook | PASS | Present at lines 671-690. Action Types table and append-only Logbook table both exist and are populated. No structural omissions observed. |

---

## Summary of `[PENDING]` Items

Observed `[PENDING]` placeholders or explicit pending dependencies in the subject document:

1. Live Dashboard: `Per-client dashboards | [PENDING — BAR-82 in progress]` at line 160.
2. Dependencies: `Dashboard layer` is `PENDING (BAR-82)` at line 170.
3. Dependencies: `Employee self-serve page` is `PENDING (BAR-82)` at line 171.
4. FCEs Attached: `FCE-008 SVG Outreach` has `[PENDING — see LBB session 27]`, `[PENDING]` Run Directory, Latest P=1, and Rows at line 206.
5. Process Composition: `Orchestrator (10/85)` Process ID is `[PENDING]` at line 335.
6. Analytics §10a: `Service request open-to-close rate` target is `[PENDING — needs Dave input on SLA]` and tolerance is `[PENDING]` at line 600.
7. Analytics §10b: Sigma tracking remains `PENDING` for trend/action establishment at lines 607-608.
8. Logbook prerequisites: `svg-d1-client binding decision made and implemented` is still pending before certification at line 650.
9. Document Control: `US Validated | pending` at line 703.

Items explicitly calling for Dave input or decision:
- Consolidation decision on `client-hub` vs `svg-d1-client` canonical ownership at line 406.
- SLA target/tolerance for `Service request open-to-close rate` at line 600.
- Binding decision for `svg-d1-client` before certification at line 650.

---

## FP-001 and FP-002 Verification

### FP-001
**Status: DOCUMENTED**

Observed references:
- Component Status Grid: `client-hub Worker ... DB binding is client-hub D1 only (svg-d1-client not yet bound)` at line 148.
- Component Status Grid: `D1: svg-d1-client ... NOT bound to client-hub worker` at line 150.
- OSAM Schema Gaps note: `client-hub worker is only bound to the client-hub D1, making svg-d1-client a dangling asset` at line 406.
- Live Verification row: `svg-d1-client NOT bound to worker` verified row at line 581.
- Fleet Failure Registry: `FP-001 | svg-d1-client not bound to worker` at line 661.

Assessment: FP-001 is clearly and repeatedly documented.

### FP-002
**Status: DOCUMENTED, BUT ONLY NARROWLY**

Observed references:
- Fleet Failure Registry: `FP-002 | client-hub D1 has no client table (migration references client FK but no client CREATE)` at line 662.
- Explanatory note: `0001_create_tables.sql migration references client(client_id) ... but does NOT contain a CREATE TABLE client statement` at line 665.

Assessment:
- FP-002 is documented in §13.
- However, the rest of the UT still treats `client` as an existing operational table in §5 READ Access, §5 WRITE Access, Join Chain, and §9 verification commands at lines 275, 297, 340, and 560-562. That unresolved contradiction is a material content defect.

---

## Overall Verdict

## **FAIL**

### Justification

1. **Multiple sections are materially non-conformant to the template or checklist:**
   - §3 fails because the Component Status Grid does not cover every listed dependency, the Live Dashboard row uses a placeholder instead of URL/N/A, and §3c still contains `[PENDING]` placeholders.
   - §5 fails because the document asserts operational use of a `client` table while also recording FP-002 that its DDL is missing from the migration set.
   - §6 fails because `service_status` is structurally an enum but is classified as a variable.
   - §7 fails because mutable operational state is listed under Constants.

2. **The document is not certifiable under its own live-verification rules:**
   - §9b still has multiple unchecked rows at lines 576, 579, 582-585.
   - The rule at line 587 states unchecked rows keep the doc PROVISIONAL and prevent OPERATE.

3. **The document does document both required failure patterns:**
   - FP-001 is well-covered.
   - FP-002 is present, but not reconciled against the rest of the document, which creates an internal contradiction.

4. **Additional checklist drift is visible at the top of the document:**
   - The UT checklist heading omits the template's `📋` marker (`## UT Checklist` at line 9 vs template `## 📋 UT Checklist`).
   - The checklist block does not reference `per law/UT_CHECKLIST.md v1.0.0` / current checklist version, even though `law/UT_CHECKLIST.md` requires that in the title.
   - The checked status of some top-box items is not supported by the body content, especially item 5 (Live Dashboard) and item 8 (FCEs Attached).

**Certification result:** FAIL until the section-level non-conformances and unresolved contradictions are corrected and the unchecked live-verification rows are grounded.
