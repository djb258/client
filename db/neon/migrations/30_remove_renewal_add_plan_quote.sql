-- ===================================================================
-- Migration: 30_remove_renewal_add_plan_quote.sql
-- Schema: clnt
-- ADR: ADR-004-renewal-downgraded-to-plan-support
-- Created: 2026-02-11
-- ===================================================================
-- PURPOSE:
--   1. Remove Renewal sub-hub (S9) — drop views, tables
--   2. Add plan_quote as support table under Plan (S2)
--   3. Add source_quote_id FK on plan for promotion lineage
-- MODIFIES: clnt.plan (one nullable column added)
-- REMOVES:  renewal_cycle, renewal_error, 3 renewal views
-- ADDS:     plan_quote
-- ===================================================================


-- ===================================================================
-- STEP 1: DROP Renewal Views
-- ===================================================================
DROP VIEW IF EXISTS clnt.v_renewal_enrollment_snapshot_summary;
DROP VIEW IF EXISTS clnt.v_renewal_plan_diff_summary;
DROP VIEW IF EXISTS clnt.v_renewal_cycles_by_client;


-- ===================================================================
-- STEP 2: DROP Renewal Tables (error first — FK dependency)
-- ===================================================================
DROP TABLE IF EXISTS clnt.renewal_error;
DROP TABLE IF EXISTS clnt.renewal_cycle;


-- ===================================================================
-- STEP 3: CREATE plan_quote (Support Table Under Plan S2)
-- ===================================================================
CREATE TABLE clnt.plan_quote (
    plan_quote_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    benefit_type    TEXT NOT NULL,
    carrier_id      TEXT NOT NULL,
    effective_year  INT NOT NULL,

    -- Fixed cost tiers (same shape as plan)
    rate_ee         NUMERIC(10,2),
    rate_es         NUMERIC(10,2),
    rate_ec         NUMERIC(10,2),
    rate_fam        NUMERIC(10,2),

    source          TEXT,
    received_date   DATE,
    status          TEXT NOT NULL DEFAULT 'received'
                    CHECK (status IN ('received', 'presented', 'selected', 'rejected')),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multiple quotes per benefit_type per year allowed — no uniqueness constraint
CREATE INDEX idx_plan_quote_client_benefit_year
    ON clnt.plan_quote(client_id, benefit_type, effective_year);
CREATE INDEX idx_plan_quote_status
    ON clnt.plan_quote(status);

COMMENT ON TABLE clnt.plan_quote IS 'S2 Plan support: Received quotes. Multiple per benefit/year allowed. Promotion copies rates into plan.';


-- ===================================================================
-- STEP 4: ADD source_quote_id to plan (promotion lineage)
-- ===================================================================
ALTER TABLE clnt.plan
    ADD COLUMN source_quote_id UUID REFERENCES clnt.plan_quote(plan_quote_id);

COMMENT ON COLUMN clnt.plan.source_quote_id IS 'FK to plan_quote that was promoted into this plan row. NULL for manual/migration plans.';


-- ===================================================================
-- VERIFICATION
-- ===================================================================
-- Expected: 13 tables in clnt schema
--   12 original backbone
--   +1 plan_quote
--   -2 renewal_cycle, renewal_error (dropped)
-- Expected: 0 views (renewal views dropped)
-- Expected: plan.source_quote_id column exists (nullable UUID FK)
