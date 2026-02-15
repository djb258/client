-- ===================================================================
-- Migration: 35_client_projection.sql
-- Schema: clnt
-- ADR: ADR-005-client-projection-support
-- Created: 2026-02-15
-- ===================================================================
-- PURPOSE:
--   1. Add client_projection as SUPPORT table under S1 (Hub)
--   2. Add v_client_dashboard as read-only view for lovable.dev
-- JUSTIFICATION: OWN-10c — additional table type requires ADR
-- ADDS: client_projection (table), v_client_dashboard (view)
-- ===================================================================


-- ===================================================================
-- STEP 1: CREATE client_projection (SUPPORT table, S1)
-- ===================================================================
CREATE TABLE clnt.client_projection (
    client_id       UUID PRIMARY KEY REFERENCES clnt.client_hub(client_id),

    -- Domain / label
    domain          TEXT,
    label_override  TEXT,

    -- Branding
    logo_url        TEXT,
    color_primary   TEXT,
    color_accent    TEXT,

    -- Feature toggles (JSONB — flexible, no schema changes per feature)
    feature_flags   JSONB NOT NULL DEFAULT '{}',

    -- Dashboard block configuration (JSONB array)
    dashboard_blocks JSONB NOT NULL DEFAULT '[]',

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_projection_domain ON clnt.client_projection(domain);

COMMENT ON TABLE clnt.client_projection IS 'S1 Hub support: Per-client UI projection configuration. 1:1 with client_hub. ADR-005.';

CREATE TRIGGER trg_client_projection_updated_at
    BEFORE UPDATE ON clnt.client_projection
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- STEP 2: CREATE v_client_dashboard (read-only view for lovable.dev)
-- ===================================================================
CREATE OR REPLACE VIEW clnt.v_client_dashboard AS
SELECT
    h.client_id,
    h.status,
    h.created_at      AS hub_created_at,
    m.legal_name,
    m.domicile_state,
    m.effective_date,
    COALESCE(p.label_override, m.legal_name) AS display_name,
    p.domain,
    p.logo_url,
    p.color_primary,
    p.color_accent,
    p.feature_flags,
    p.dashboard_blocks
FROM clnt.client_hub h
JOIN clnt.client_master m USING (client_id)
LEFT JOIN clnt.client_projection p USING (client_id);

COMMENT ON VIEW clnt.v_client_dashboard IS 'Read-only dashboard surface for lovable.dev. Joins hub + master + projection. ADR-005.';


-- ===================================================================
-- VERIFICATION
-- ===================================================================
-- Expected: 14 tables in clnt schema
--   13 from backbone + plan_quote
--   +1 client_projection
-- Expected: 1 view (v_client_dashboard)
