-- ===================================================================
-- Migration: 45_v341_consolidation.sql
-- Schema: clnt
-- ADR: ADR-006-v341-consolidation
-- Doctrine: v3.4.1
-- Created: 2026-02-25
-- ===================================================================
-- PURPOSE: Align database with v3.4.1 registry (16 tables, 5 spokes).
--
-- CHANGES:
--   1. Merge client_hub + client_master + client_projection → client
--   2. Add 5 error tables (one per spoke)
--   3. Add invoice table (S4 SUPPORT)
--   4. Rename intake_batch → enrollment_intake
--   5. Drop compliance_flag, audit_event (not in v3.4.1 registry)
--   6. Drop v_client_dashboard view (0 views in v3.4.1)
--   7. Update ctb.table_registry to match new 16-table structure
--   8. Re-point all FK references from client_hub → client
-- ===================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Create new unified client table (SPINE)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE clnt.client (
    client_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- From client_master
    legal_name        TEXT NOT NULL,
    fein              TEXT,
    domicile_state    TEXT,
    effective_date    DATE,

    -- From client_hub
    status            TEXT NOT NULL DEFAULT 'active',
    source            TEXT,
    version           INT NOT NULL DEFAULT 1,

    -- From client_projection (ADR-005)
    domain            TEXT,
    label_override    TEXT,
    logo_url          TEXT,
    color_primary     TEXT,
    color_accent      TEXT,
    feature_flags     JSONB NOT NULL DEFAULT '{}',
    dashboard_blocks  JSONB NOT NULL DEFAULT '[]',

    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_fein ON clnt.client(fein);
CREATE INDEX idx_client_state ON clnt.client(domicile_state);
CREATE INDEX idx_client_status ON clnt.client(status);
CREATE INDEX idx_client_domain ON clnt.client(domain);

COMMENT ON TABLE clnt.client IS 'S1 Hub SPINE: Unified client identity. Merges former client_hub + client_master + client_projection.';

CREATE TRIGGER trg_client_updated_at
    BEFORE UPDATE ON clnt.client
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Migrate data from old tables into new client table
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO clnt.client (
    client_id, legal_name, fein, domicile_state, effective_date,
    status, source, version,
    domain, label_override, logo_url, color_primary, color_accent,
    feature_flags, dashboard_blocks,
    created_at, updated_at
)
SELECT
    h.client_id,
    COALESCE(m.legal_name, 'UNKNOWN'),
    m.fein,
    m.domicile_state,
    m.effective_date,
    h.status,
    h.source,
    h.version,
    p.domain,
    p.label_override,
    p.logo_url,
    p.color_primary,
    p.color_accent,
    COALESCE(p.feature_flags, '{}'),
    COALESCE(p.dashboard_blocks, '[]'),
    h.created_at,
    COALESCE(m.updated_at, h.created_at)
FROM clnt.client_hub h
LEFT JOIN clnt.client_master m USING (client_id)
LEFT JOIN clnt.client_projection p USING (client_id);


-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: Re-point all FK references from client_hub → client
-- ═══════════════════════════════════════════════════════════════════

-- plan
ALTER TABLE clnt.plan DROP CONSTRAINT IF EXISTS plan_client_id_fkey;
ALTER TABLE clnt.plan ADD CONSTRAINT plan_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- plan_quote
ALTER TABLE clnt.plan_quote DROP CONSTRAINT IF EXISTS plan_quote_client_id_fkey;
ALTER TABLE clnt.plan_quote ADD CONSTRAINT plan_quote_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- intake_batch (will be renamed to enrollment_intake)
ALTER TABLE clnt.intake_batch DROP CONSTRAINT IF EXISTS intake_batch_client_id_fkey;
ALTER TABLE clnt.intake_batch ADD CONSTRAINT intake_batch_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- intake_record
ALTER TABLE clnt.intake_record DROP CONSTRAINT IF EXISTS intake_record_client_id_fkey;
ALTER TABLE clnt.intake_record ADD CONSTRAINT intake_record_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- person
ALTER TABLE clnt.person DROP CONSTRAINT IF EXISTS person_client_id_fkey;
ALTER TABLE clnt.person ADD CONSTRAINT person_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- election
ALTER TABLE clnt.election DROP CONSTRAINT IF EXISTS election_client_id_fkey;
ALTER TABLE clnt.election ADD CONSTRAINT election_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- vendor
ALTER TABLE clnt.vendor DROP CONSTRAINT IF EXISTS vendor_client_id_fkey;
ALTER TABLE clnt.vendor ADD CONSTRAINT vendor_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- external_identity_map
ALTER TABLE clnt.external_identity_map DROP CONSTRAINT IF EXISTS external_identity_map_client_id_fkey;
ALTER TABLE clnt.external_identity_map ADD CONSTRAINT external_identity_map_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- service_request
ALTER TABLE clnt.service_request DROP CONSTRAINT IF EXISTS service_request_client_id_fkey;
ALTER TABLE clnt.service_request ADD CONSTRAINT service_request_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clnt.client(client_id);

-- compliance_flag (FK update before drop, in case dependent objects)
ALTER TABLE clnt.compliance_flag DROP CONSTRAINT IF EXISTS compliance_flag_client_id_fkey;

-- audit_event (FK update before drop)
ALTER TABLE clnt.audit_event DROP CONSTRAINT IF EXISTS audit_event_client_id_fkey;


-- ═══════════════════════════════════════════════════════════════════
-- STEP 4: Drop old client tables and deprecated tables
-- ═══════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS clnt.v_client_dashboard;
DROP TABLE IF EXISTS clnt.client_projection;
DROP TABLE IF EXISTS clnt.client_master;
DROP TABLE IF EXISTS clnt.compliance_flag;
DROP TABLE IF EXISTS clnt.audit_event;
DROP TABLE IF EXISTS clnt.client_hub;


-- ═══════════════════════════════════════════════════════════════════
-- STEP 5: Rename intake_batch → enrollment_intake
-- ═══════════════════════════════════════════════════════════════════

-- Update intake_record FK reference first
ALTER TABLE clnt.intake_record DROP CONSTRAINT IF EXISTS intake_record_intake_batch_id_fkey;

ALTER TABLE clnt.intake_batch RENAME TO enrollment_intake;
ALTER TABLE clnt.enrollment_intake RENAME COLUMN intake_batch_id TO enrollment_intake_id;

-- Rename indexes
ALTER INDEX IF EXISTS clnt.idx_intake_batch_client RENAME TO idx_enrollment_intake_client;
ALTER INDEX IF EXISTS clnt.idx_intake_batch_status RENAME TO idx_enrollment_intake_status;

-- Re-add FK from intake_record
ALTER TABLE clnt.intake_record RENAME COLUMN intake_batch_id TO enrollment_intake_id;
ALTER TABLE clnt.intake_record ADD CONSTRAINT intake_record_enrollment_intake_id_fkey
    FOREIGN KEY (enrollment_intake_id) REFERENCES clnt.enrollment_intake(enrollment_intake_id);

-- Rename trigger
DROP TRIGGER IF EXISTS trg_intake_batch_updated_at ON clnt.enrollment_intake;
CREATE TRIGGER trg_enrollment_intake_updated_at
    BEFORE UPDATE ON clnt.enrollment_intake
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();

COMMENT ON TABLE clnt.enrollment_intake IS 'S3 Employee STAGING: Enrollment batch header. Insert + status update only.';


-- ═══════════════════════════════════════════════════════════════════
-- STEP 6: Create 5 error tables (one per spoke — OWN-10b)
-- ═══════════════════════════════════════════════════════════════════

-- S1: client_error
CREATE TABLE clnt.client_error (
    client_error_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES clnt.client(client_id),
    error_code        TEXT NOT NULL,
    error_message     TEXT,
    severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source_entity_id  UUID,
    context           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_error_client ON clnt.client_error(client_id);
CREATE INDEX idx_client_error_severity ON clnt.client_error(severity);
CREATE INDEX idx_client_error_status ON clnt.client_error(status);
COMMENT ON TABLE clnt.client_error IS 'S1 Hub ERROR: Client-level error tracking. Append-only.';

-- S2: plan_error
CREATE TABLE clnt.plan_error (
    plan_error_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES clnt.client(client_id),
    error_code        TEXT NOT NULL,
    error_message     TEXT,
    severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source_entity_id  UUID,
    context           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_error_client ON clnt.plan_error(client_id);
CREATE INDEX idx_plan_error_severity ON clnt.plan_error(severity);
CREATE INDEX idx_plan_error_status ON clnt.plan_error(status);
COMMENT ON TABLE clnt.plan_error IS 'S2 Plan ERROR: Plan-level error tracking. Append-only.';

-- S3: employee_error
CREATE TABLE clnt.employee_error (
    employee_error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES clnt.client(client_id),
    error_code        TEXT NOT NULL,
    error_message     TEXT,
    severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source_entity_id  UUID,
    context           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_error_client ON clnt.employee_error(client_id);
CREATE INDEX idx_employee_error_severity ON clnt.employee_error(severity);
CREATE INDEX idx_employee_error_status ON clnt.employee_error(status);
COMMENT ON TABLE clnt.employee_error IS 'S3 Employee ERROR: Employee/enrollment error tracking. Append-only.';

-- S4: vendor_error
CREATE TABLE clnt.vendor_error (
    vendor_error_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES clnt.client(client_id),
    error_code        TEXT NOT NULL,
    error_message     TEXT,
    severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source_entity_id  UUID,
    context           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_error_client ON clnt.vendor_error(client_id);
CREATE INDEX idx_vendor_error_severity ON clnt.vendor_error(severity);
CREATE INDEX idx_vendor_error_status ON clnt.vendor_error(status);
COMMENT ON TABLE clnt.vendor_error IS 'S4 Vendor ERROR: Vendor-level error tracking. Append-only.';

-- S5: service_error
CREATE TABLE clnt.service_error (
    service_error_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES clnt.client(client_id),
    error_code        TEXT NOT NULL,
    error_message     TEXT,
    severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    source_entity_id  UUID,
    context           JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_error_client ON clnt.service_error(client_id);
CREATE INDEX idx_service_error_severity ON clnt.service_error(severity);
CREATE INDEX idx_service_error_status ON clnt.service_error(status);
COMMENT ON TABLE clnt.service_error IS 'S5 Service ERROR: Service-level error tracking. Append-only.';


-- ═══════════════════════════════════════════════════════════════════
-- STEP 7: Create invoice table (S4 SUPPORT)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE clnt.invoice (
    invoice_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id         UUID NOT NULL REFERENCES clnt.client(client_id),
    vendor_id         UUID NOT NULL REFERENCES clnt.vendor(vendor_id),
    invoice_number    TEXT,
    amount            NUMERIC(12,2),
    due_date          DATE,
    status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_client ON clnt.invoice(client_id);
CREATE INDEX idx_invoice_vendor ON clnt.invoice(vendor_id);
CREATE INDEX idx_invoice_status ON clnt.invoice(status);
CREATE INDEX idx_invoice_due_date ON clnt.invoice(due_date);

COMMENT ON TABLE clnt.invoice IS 'S4 Vendor SUPPORT: Vendor invoices. Insert + status/due_date update.';

CREATE TRIGGER trg_invoice_updated_at
    BEFORE UPDATE ON clnt.invoice
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════
-- STEP 8: Update table comments to reflect v3.4.1 spoke assignments
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON TABLE clnt.plan IS 'S2 Plan CANONICAL: Benefit plans with fixed 4-tier cost structure.';
COMMENT ON TABLE clnt.plan_quote IS 'S2 Plan SUPPORT: Plan quotes for renewal workflow. ADR-004.';
COMMENT ON TABLE clnt.person IS 'S3 Employee CANONICAL: Employee/dependent identity records.';
COMMENT ON TABLE clnt.election IS 'S3 Employee SUPPORT: Benefit election bridge (person-to-plan).';
COMMENT ON TABLE clnt.intake_record IS 'S3 Employee STAGING: Raw enrollment records within a batch. Immutable after insert.';
COMMENT ON TABLE clnt.vendor IS 'S4 Vendor CANONICAL: Vendor identity per client.';
COMMENT ON TABLE clnt.external_identity_map IS 'S4 Vendor SUPPORT: Internal-to-external ID translation.';
COMMENT ON TABLE clnt.service_request IS 'S5 Service CANONICAL: Service ticket tracking.';


-- ═══════════════════════════════════════════════════════════════════
-- STEP 9: Update ctb.table_registry (if migration 40 was applied)
-- ═══════════════════════════════════════════════════════════════════

-- Clear old registrations
DELETE FROM ctb.table_registry WHERE table_schema = 'clnt';

-- Register all 16 v3.4.1 tables
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    -- S1: Hub
    ('clnt', 'client',                'client-subhive', 's1-hub',       'CANONICAL', 'Unified client identity (SPINE). Merges former hub + master + projection.'),
    ('clnt', 'client_error',          'client-subhive', 's1-hub',       'ERROR',     'Client-level error tracking. Append-only.'),
    -- S2: Plan
    ('clnt', 'plan',                  'client-subhive', 's2-plan',      'CANONICAL', 'Benefit plans with fixed 4-tier cost structure.'),
    ('clnt', 'plan_error',            'client-subhive', 's2-plan',      'ERROR',     'Plan-level error tracking. Append-only.'),
    ('clnt', 'plan_quote',            'client-subhive', 's2-plan',      'SUPPORT',   'Plan quotes for renewal workflow. ADR-004.'),
    -- S3: Employee
    ('clnt', 'person',                'client-subhive', 's3-employee',  'CANONICAL', 'Employee/dependent identity records.'),
    ('clnt', 'employee_error',        'client-subhive', 's3-employee',  'ERROR',     'Employee/enrollment error tracking. Append-only.'),
    ('clnt', 'election',              'client-subhive', 's3-employee',  'SUPPORT',   'Benefit election bridge (person-to-plan).'),
    ('clnt', 'enrollment_intake',     'client-subhive', 's3-employee',  'STAGING',   'Enrollment batch header. Insert + status update.'),
    ('clnt', 'intake_record',         'client-subhive', 's3-employee',  'STAGING',   'Raw enrollment records within a batch. Immutable after insert.'),
    -- S4: Vendor
    ('clnt', 'vendor',                'client-subhive', 's4-vendor',    'CANONICAL', 'Vendor identity per client.'),
    ('clnt', 'vendor_error',          'client-subhive', 's4-vendor',    'ERROR',     'Vendor-level error tracking. Append-only.'),
    ('clnt', 'external_identity_map', 'client-subhive', 's4-vendor',    'SUPPORT',   'Internal-to-external ID translation.'),
    ('clnt', 'invoice',               'client-subhive', 's4-vendor',    'SUPPORT',   'Vendor invoices. Insert + status/due_date update.'),
    -- S5: Service
    ('clnt', 'service_request',       'client-subhive', 's5-service',   'CANONICAL', 'Service ticket tracking.'),
    ('clnt', 'service_error',         'client-subhive', 's5-service',   'ERROR',     'Service-level error tracking. Append-only.')
ON CONFLICT (table_schema, table_name) DO UPDATE SET
    hub_id = EXCLUDED.hub_id,
    subhub_id = EXCLUDED.subhub_id,
    leaf_type = EXCLUDED.leaf_type,
    description = EXCLUDED.description;


-- ═══════════════════════════════════════════════════════════════════
-- STEP 10: Update promotion paths
-- ═══════════════════════════════════════════════════════════════════

-- Remove old promotion paths (if migration 40 was applied)
DELETE FROM ctb.promotion_paths WHERE source_schema = 'clnt';

INSERT INTO ctb.promotion_paths (source_schema, source_table, target_schema, target_table, description)
VALUES
    ('clnt', 'intake_record',       'clnt', 'person',   'Raw enrollment → canonical employee identity'),
    ('clnt', 'intake_record',       'clnt', 'election', 'Raw enrollment → benefit election'),
    ('clnt', 'plan_quote',          'clnt', 'plan',     'Selected quote → active plan (rates copied)')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════
-- Expected after migration:
--   16 tables in clnt schema:
--     S1: client, client_error
--     S2: plan, plan_error, plan_quote
--     S3: person, employee_error, election, enrollment_intake, intake_record
--     S4: vendor, vendor_error, external_identity_map, invoice
--     S5: service_request, service_error
--   0 views
--   16 rows in ctb.table_registry WHERE table_schema = 'clnt'

COMMIT;
