-- ===================================================================
-- Migration: 25_add_renewal_subhub.sql
-- Schema: clnt (Renewal Sub-Hub Extension)
-- ADR: ADR-003-renewal-subhub
-- Created: 2026-02-11
-- ===================================================================
-- PURPOSE: Add Renewal sub-hub (S9) with 2 tables + 3 views
-- ADDS:
--   Tables: renewal_cycle, renewal_error
--   Views:  v_renewal_cycles_by_client,
--           v_renewal_plan_diff_summary,
--           v_renewal_enrollment_snapshot_summary
-- MODIFIES: Nothing. Zero changes to existing 12 tables.
-- ===================================================================


-- ===================================================================
-- S9: RENEWAL CYCLE — Canonical lifecycle table
-- ===================================================================
CREATE TABLE clnt.renewal_cycle (
    renewal_cycle_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    renewal_year        INT NOT NULL,
    effective_date      DATE NOT NULL,
    status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'quoted', 'selected', 'bound', 'archived')),
    prior_plan_version  TEXT,
    new_plan_version    TEXT,
    source              TEXT NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('quote', 'manual', 'migration')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_renewal_cycle_client ON clnt.renewal_cycle(client_id);
CREATE INDEX idx_renewal_cycle_client_eff ON clnt.renewal_cycle(client_id, effective_date);
CREATE INDEX idx_renewal_cycle_status ON clnt.renewal_cycle(status);

-- Prevent duplicate active cycles: one non-archived per (client_id, renewal_year)
CREATE UNIQUE INDEX idx_renewal_cycle_active_unique
    ON clnt.renewal_cycle(client_id, renewal_year)
    WHERE status <> 'archived';

COMMENT ON TABLE clnt.renewal_cycle IS 'S9 Renewal: Cycle identity and lifecycle state. One active cycle per client per year.';

CREATE TRIGGER trg_renewal_cycle_updated_at
    BEFORE UPDATE ON clnt.renewal_cycle
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S9: RENEWAL ERROR — Error capture scoped to cycle
-- ===================================================================
CREATE TABLE clnt.renewal_error (
    renewal_error_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    renewal_cycle_id    UUID REFERENCES clnt.renewal_cycle(renewal_cycle_id),
    error_code          TEXT NOT NULL,
    error_message       TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_renewal_error_client ON clnt.renewal_error(client_id);
CREATE INDEX idx_renewal_error_cycle ON clnt.renewal_error(renewal_cycle_id);

COMMENT ON TABLE clnt.renewal_error IS 'S9 Renewal: Error capture. Nullable cycle FK allows orphan errors before cycle creation.';


-- ===================================================================
-- VIEW: v_renewal_cycles_by_client
-- Active and historical cycles joined to client identity
-- ===================================================================
CREATE OR REPLACE VIEW clnt.v_renewal_cycles_by_client AS
SELECT
    rc.renewal_cycle_id,
    rc.client_id,
    cm.legal_name,
    rc.renewal_year,
    rc.effective_date,
    rc.status,
    rc.prior_plan_version,
    rc.new_plan_version,
    rc.source,
    rc.created_at,
    rc.updated_at
FROM clnt.renewal_cycle rc
JOIN clnt.client_master cm ON cm.client_id = rc.client_id;

COMMENT ON VIEW clnt.v_renewal_cycles_by_client IS 'Read-only: Renewal cycles with client legal name. No writes.';


-- ===================================================================
-- VIEW: v_renewal_plan_diff_summary
-- Rate comparison: prior plan version vs new plan version per cycle
-- ===================================================================
CREATE OR REPLACE VIEW clnt.v_renewal_plan_diff_summary AS
SELECT
    rc.renewal_cycle_id,
    rc.client_id,
    rc.renewal_year,
    rc.status           AS cycle_status,
    p.plan_id,
    p.benefit_type,
    p.carrier_id,
    p.version           AS plan_version,
    p.rate_ee,
    p.rate_es,
    p.rate_ec,
    p.rate_fam,
    p.employer_rate_ee,
    p.employer_rate_es,
    p.employer_rate_ec,
    p.employer_rate_fam,
    p.effective_date    AS plan_effective_date,
    p.status            AS plan_status
FROM clnt.renewal_cycle rc
JOIN clnt.plan p ON p.client_id = rc.client_id
WHERE p.version::TEXT IN (rc.prior_plan_version, rc.new_plan_version)
   OR (rc.prior_plan_version IS NULL AND rc.new_plan_version IS NULL);

COMMENT ON VIEW clnt.v_renewal_plan_diff_summary IS 'Read-only: Plan rates for prior/new versions within a renewal cycle. No writes.';


-- ===================================================================
-- VIEW: v_renewal_enrollment_snapshot_summary
-- Enrollment counts by coverage tier for each renewal cycle
-- ===================================================================
CREATE OR REPLACE VIEW clnt.v_renewal_enrollment_snapshot_summary AS
SELECT
    rc.renewal_cycle_id,
    rc.client_id,
    rc.renewal_year,
    rc.status           AS cycle_status,
    p.benefit_type,
    e.coverage_tier,
    COUNT(DISTINCT e.person_id) AS enrolled_count
FROM clnt.renewal_cycle rc
JOIN clnt.election e ON e.client_id = rc.client_id
JOIN clnt.plan p ON p.plan_id = e.plan_id
WHERE e.effective_date <= rc.effective_date
GROUP BY
    rc.renewal_cycle_id,
    rc.client_id,
    rc.renewal_year,
    rc.status,
    p.benefit_type,
    e.coverage_tier;

COMMENT ON VIEW clnt.v_renewal_enrollment_snapshot_summary IS 'Read-only: Enrollment count by tier per renewal cycle. No writes.';


-- ===================================================================
-- VERIFICATION
-- ===================================================================
-- Expected: 14 tables in clnt schema (+2 from 12 baseline)
-- New: renewal_cycle, renewal_error
-- Views: v_renewal_cycles_by_client, v_renewal_plan_diff_summary,
--        v_renewal_enrollment_snapshot_summary
-- Existing 12 tables: UNTOUCHED
