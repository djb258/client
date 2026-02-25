-- ===================================================================
-- Migration: 40_ctb_registry_infrastructure.sql
-- Schema: ctb (CTB Governance Infrastructure)
-- Authority: imo-creator (Constitutional) — adapted for client-subhive
-- Doctrine: CTB_REGISTRY_ENFORCEMENT.md §4
-- Created: 2026-02-25
-- ===================================================================
-- PURPOSE: Deploy the CTB enforcement infrastructure and register
--          all existing tables in clnt schema.
--
-- Adapts template migrations 001-005 from imo-creator:
--   001: ctb schema + table_registry + audit log
--   002: DDL event triggers (CREATE/ALTER/DROP gate)
--   003: Write guard triggers
--   004: Promotion paths enforcement
--   005: Immutability enforcement + vendor bridges
--
-- Then registers all 14 existing clnt tables and attaches guards.
-- ===================================================================

-- ═══════════════════════════════════════════════════════════════════
-- PART 1: CTB Schema + Table Registry (from template 001)
-- ═══════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS ctb;

COMMENT ON SCHEMA ctb IS 'CTB governance schema — table registry, enforcement triggers, audit log';

-- Table Registry: every allowed table must have a row here
CREATE TABLE IF NOT EXISTS ctb.table_registry (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_schema            TEXT NOT NULL DEFAULT 'clnt',
    table_name              TEXT NOT NULL,
    hub_id                  TEXT NOT NULL,
    subhub_id               TEXT NOT NULL,
    leaf_type               TEXT NOT NULL CHECK (leaf_type IN ('CANONICAL', 'ERROR', 'SUPPORT', 'STAGING', 'MV', 'REGISTRY')),
    is_frozen               BOOLEAN NOT NULL DEFAULT false,
    blueprint_version_hash  TEXT,
    description             TEXT,
    registered_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    registered_by           TEXT NOT NULL DEFAULT current_user,

    CONSTRAINT uq_table_registry_table UNIQUE (table_schema, table_name)
);

COMMENT ON TABLE ctb.table_registry IS 'Runtime mirror of column_registry.yml — every allowed table must be registered here';
COMMENT ON COLUMN ctb.table_registry.leaf_type IS 'CANONICAL, ERROR, SUPPORT, STAGING, MV, or REGISTRY';
COMMENT ON COLUMN ctb.table_registry.is_frozen IS 'When true, table structure cannot be altered';

CREATE INDEX IF NOT EXISTS idx_table_registry_lookup
    ON ctb.table_registry (table_schema, table_name);

CREATE INDEX IF NOT EXISTS idx_table_registry_hub
    ON ctb.table_registry (hub_id, subhub_id);

CREATE INDEX IF NOT EXISTS idx_table_registry_leaf
    ON ctb.table_registry (leaf_type);

-- Registry Audit Log: tracks all changes to table_registry
CREATE TABLE IF NOT EXISTS ctb.registry_audit_log (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operation       TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    table_schema    TEXT NOT NULL,
    table_name      TEXT NOT NULL,
    hub_id          TEXT,
    subhub_id       TEXT,
    leaf_type       TEXT,
    changed_by      TEXT NOT NULL DEFAULT current_user,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_values      JSONB,
    new_values      JSONB
);

COMMENT ON TABLE ctb.registry_audit_log IS 'Audit trail for all ctb.table_registry changes';

CREATE INDEX IF NOT EXISTS idx_registry_audit_table
    ON ctb.registry_audit_log (table_schema, table_name);

CREATE INDEX IF NOT EXISTS idx_registry_audit_time
    ON ctb.registry_audit_log (changed_at);

-- Audit trigger on table_registry
CREATE OR REPLACE FUNCTION ctb.audit_registry_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO ctb.registry_audit_log (operation, table_schema, table_name, hub_id, subhub_id, leaf_type, new_values)
        VALUES ('INSERT', NEW.table_schema, NEW.table_name, NEW.hub_id, NEW.subhub_id, NEW.leaf_type,
                to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO ctb.registry_audit_log (operation, table_schema, table_name, hub_id, subhub_id, leaf_type, old_values, new_values)
        VALUES ('UPDATE', NEW.table_schema, NEW.table_name, NEW.hub_id, NEW.subhub_id, NEW.leaf_type,
                to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO ctb.registry_audit_log (operation, table_schema, table_name, hub_id, subhub_id, leaf_type, old_values)
        VALUES ('DELETE', OLD.table_schema, OLD.table_name, OLD.hub_id, OLD.subhub_id, OLD.leaf_type,
                to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_registry ON ctb.table_registry;
CREATE TRIGGER trg_audit_registry
    AFTER INSERT OR UPDATE OR DELETE ON ctb.table_registry
    FOR EACH ROW EXECUTE FUNCTION ctb.audit_registry_changes();


-- ═══════════════════════════════════════════════════════════════════
-- PART 2: Register All Existing Tables
-- ═══════════════════════════════════════════════════════════════════
-- 14 tables in clnt schema (from migrations 20, 30, 35)

-- S1: Hub spoke
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    ('clnt', 'client_hub',         'client-subhive', 'S1-hub',      'CANONICAL', 'Root client identity. Read-only after creation.'),
    ('clnt', 'client_master',      'client-subhive', 'S1-hub',      'CANONICAL', 'Client legal/business details.'),
    ('clnt', 'client_projection',  'client-subhive', 'S1-hub',      'SUPPORT',   'Client branding/UI projection. ADR-005.')
ON CONFLICT (table_schema, table_name) DO NOTHING;

-- S2: Plan spoke
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    ('clnt', 'plan',               'client-subhive', 'S2-plan',     'CANONICAL', 'Benefit plans with fixed 4-tier cost structure.'),
    ('clnt', 'plan_quote',         'client-subhive', 'S2-plan',     'SUPPORT',   'Plan quotes for renewal workflow. ADR-004.')
ON CONFLICT (table_schema, table_name) DO NOTHING;

-- S3: Employee spoke
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    ('clnt', 'person',             'client-subhive', 'S3-employee',  'CANONICAL', 'Employee/dependent identity records.'),
    ('clnt', 'election',           'client-subhive', 'S3-employee',  'SUPPORT',   'Benefit election bridge (person → plan).'),
    ('clnt', 'intake_batch',       'client-subhive', 'S3-employee',  'STAGING',   'Enrollment batch upload header.'),
    ('clnt', 'intake_record',      'client-subhive', 'S3-employee',  'STAGING',   'Raw enrollment records within a batch.')
ON CONFLICT (table_schema, table_name) DO NOTHING;

-- S4: Vendor spoke
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    ('clnt', 'vendor',             'client-subhive', 'S4-vendor',    'CANONICAL', 'Vendor identity per client.'),
    ('clnt', 'external_identity_map', 'client-subhive', 'S4-vendor', 'SUPPORT',   'Internal-to-external ID translation.')
ON CONFLICT (table_schema, table_name) DO NOTHING;

-- S5: Service spoke
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    ('clnt', 'service_request',    'client-subhive', 'S5-service',   'CANONICAL', 'Service ticket tracking.'),
    ('clnt', 'compliance_flag',    'client-subhive', 'S5-service',   'CANONICAL', 'Compliance flag tracking per client.')
ON CONFLICT (table_schema, table_name) DO NOTHING;

-- System infrastructure
INSERT INTO ctb.table_registry (table_schema, table_name, hub_id, subhub_id, leaf_type, description)
VALUES
    ('clnt', 'audit_event',        'client-subhive', 'S1-hub',       'STAGING',   'Append-only system audit trail.')
ON CONFLICT (table_schema, table_name) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════
-- PART 3: DDL Event Triggers (from template 002)
-- ═══════════════════════════════════════════════════════════════════

-- Block CREATE/ALTER TABLE on unregistered tables
CREATE OR REPLACE FUNCTION ctb.enforce_table_registration()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    obj RECORD;
    tbl_schema TEXT;
    tbl_name TEXT;
    is_registered BOOLEAN;
    tbl_frozen BOOLEAN;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF obj.object_type != 'table' THEN
            CONTINUE;
        END IF;

        tbl_schema := split_part(obj.object_identity, '.', 1);
        tbl_name := split_part(obj.object_identity, '.', 2);

        -- Skip ctb schema (governance infrastructure)
        IF tbl_schema = 'ctb' THEN
            CONTINUE;
        END IF;

        -- Skip pg_temp schemas (temporary tables)
        IF tbl_schema LIKE 'pg_temp%' THEN
            CONTINUE;
        END IF;

        SELECT EXISTS(
            SELECT 1 FROM ctb.table_registry
            WHERE table_registry.table_schema = tbl_schema
              AND table_registry.table_name = tbl_name
        ) INTO is_registered;

        IF NOT is_registered THEN
            RAISE EXCEPTION 'CTB_DDL_GATE: Table %.% is not registered in ctb.table_registry. '
                            'Register the table BEFORE creating/altering it. '
                            'Doctrine: CTB_REGISTRY_ENFORCEMENT.md §4.2',
                            tbl_schema, tbl_name;
        END IF;

        IF obj.command_tag LIKE 'ALTER%' THEN
            SELECT tr.is_frozen INTO tbl_frozen
            FROM ctb.table_registry tr
            WHERE tr.table_schema = tbl_schema
              AND tr.table_name = tbl_name;

            IF tbl_frozen THEN
                RAISE EXCEPTION 'CTB_DDL_GATE: Table %.% is FROZEN — structure cannot be altered.',
                                tbl_schema, tbl_name;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Block DROP TABLE on unregistered tables
CREATE OR REPLACE FUNCTION ctb.enforce_table_drop_registration()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    obj RECORD;
    tbl_schema TEXT;
    tbl_name TEXT;
    is_registered BOOLEAN;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
        IF obj.object_type != 'table' THEN
            CONTINUE;
        END IF;

        tbl_schema := obj.schema_name;
        tbl_name := obj.object_name;

        IF tbl_schema = 'ctb' THEN
            CONTINUE;
        END IF;

        IF tbl_schema LIKE 'pg_temp%' THEN
            CONTINUE;
        END IF;

        SELECT EXISTS(
            SELECT 1 FROM ctb.table_registry
            WHERE table_registry.table_schema = tbl_schema
              AND table_registry.table_name = tbl_name
        ) INTO is_registered;

        IF NOT is_registered THEN
            RAISE EXCEPTION 'CTB_DDL_GATE: Cannot DROP %.% — not registered in ctb.table_registry.',
                            tbl_schema, tbl_name;
        END IF;
    END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS ctb_enforce_table_registration;
DROP EVENT TRIGGER IF EXISTS ctb_enforce_table_drop;

CREATE EVENT TRIGGER ctb_enforce_table_registration
    ON ddl_command_end
    WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE')
    EXECUTE FUNCTION ctb.enforce_table_registration();

CREATE EVENT TRIGGER ctb_enforce_table_drop
    ON sql_drop
    WHEN TAG IN ('DROP TABLE')
    EXECUTE FUNCTION ctb.enforce_table_drop_registration();


-- ═══════════════════════════════════════════════════════════════════
-- PART 4: Write Guards (from template 003)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION ctb.write_guard_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    is_registered BOOLEAN;
    tbl_frozen BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM ctb.table_registry
        WHERE table_registry.table_schema = TG_TABLE_SCHEMA
          AND table_registry.table_name = TG_TABLE_NAME
    ) INTO is_registered;

    IF NOT is_registered THEN
        RAISE EXCEPTION 'CTB_WRITE_GUARD: Table %.% is not registered in ctb.table_registry.',
                        TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;

    SELECT tr.is_frozen INTO tbl_frozen
    FROM ctb.table_registry tr
    WHERE tr.table_schema = TG_TABLE_SCHEMA
      AND tr.table_name = TG_TABLE_NAME;

    IF tbl_frozen THEN
        RAISE EXCEPTION 'CTB_WRITE_GUARD: Table %.% is FROZEN — writes are blocked.',
                        TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Helper: attach write guard to a table
CREATE OR REPLACE FUNCTION ctb.create_write_guard(p_schema TEXT, p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    trigger_name TEXT;
    full_table TEXT;
BEGIN
    trigger_name := 'trg_ctb_write_guard_' || p_table;
    full_table := quote_ident(p_schema) || '.' || quote_ident(p_table);

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, full_table);
    EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON %s '
        'FOR EACH ROW EXECUTE FUNCTION ctb.write_guard_check()',
        trigger_name, full_table
    );

    RAISE NOTICE 'CTB write guard attached to %', full_table;
END;
$$;

-- Helper: remove write guard
CREATE OR REPLACE FUNCTION ctb.remove_write_guard(p_schema TEXT, p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    trigger_name TEXT;
    full_table TEXT;
BEGIN
    trigger_name := 'trg_ctb_write_guard_' || p_table;
    full_table := quote_ident(p_schema) || '.' || quote_ident(p_table);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, full_table);
    RAISE NOTICE 'CTB write guard removed from %', full_table;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- PART 5: Promotion Enforcement (from template 004)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ctb.promotion_paths (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_schema       TEXT NOT NULL DEFAULT 'clnt',
    source_table        TEXT NOT NULL,
    target_schema       TEXT NOT NULL DEFAULT 'clnt',
    target_table        TEXT NOT NULL,
    hub_id              TEXT NOT NULL,
    subhub_id           TEXT NOT NULL,
    description         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          TEXT NOT NULL DEFAULT current_user,

    CONSTRAINT uq_promotion_path UNIQUE (source_schema, source_table, target_schema, target_table)
);

COMMENT ON TABLE ctb.promotion_paths IS 'Declared data flow paths from STAGING/SUPPORT → CANONICAL tables';

CREATE INDEX IF NOT EXISTS idx_promotion_paths_target
    ON ctb.promotion_paths (target_schema, target_table);

CREATE INDEX IF NOT EXISTS idx_promotion_paths_source
    ON ctb.promotion_paths (source_schema, source_table);

-- Register known promotion paths for client-subhive
INSERT INTO ctb.promotion_paths (source_schema, source_table, target_schema, target_table, hub_id, subhub_id, description)
VALUES
    -- S3: intake_record → person (enrollment intake promotes to person records)
    ('clnt', 'intake_record', 'clnt', 'person',    'client-subhive', 'S3-employee', 'Enrollment intake promotes to person records'),
    -- S3: intake_record → election (enrollment intake promotes to election records)
    ('clnt', 'intake_record', 'clnt', 'election',  'client-subhive', 'S3-employee', 'Enrollment intake promotes to election records'),
    -- S2: plan_quote → plan (selected quote promotes to active plan)
    ('clnt', 'plan_quote',    'clnt', 'plan',      'client-subhive', 'S2-plan',     'Selected plan quote promotes to active plan')
ON CONFLICT (source_schema, source_table, target_schema, target_table) DO NOTHING;

-- Promotion enforcement trigger function
CREATE OR REPLACE FUNCTION ctb.enforce_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    target_leaf_type TEXT;
    promotion_source TEXT;
    src_schema TEXT;
    src_table TEXT;
    path_exists BOOLEAN;
BEGIN
    SELECT tr.leaf_type INTO target_leaf_type
    FROM ctb.table_registry tr
    WHERE tr.table_schema = TG_TABLE_SCHEMA
      AND tr.table_name = TG_TABLE_NAME;

    IF target_leaf_type IS NULL OR target_leaf_type != 'CANONICAL' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    BEGIN
        promotion_source := current_setting('ctb.promotion_source', true);
    EXCEPTION WHEN OTHERS THEN
        promotion_source := NULL;
    END;

    IF promotion_source IS NULL OR promotion_source = '' THEN
        RAISE EXCEPTION 'CTB_PROMOTION_GATE: Direct write to CANONICAL table %.% is not allowed. '
                        'Set ctb.promotion_source session variable to declare the source table. '
                        'Usage: SET LOCAL ctb.promotion_source = ''schema.source_table'';',
                        TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;

    IF position('.' in promotion_source) > 0 THEN
        src_schema := split_part(promotion_source, '.', 1);
        src_table := split_part(promotion_source, '.', 2);
    ELSE
        src_schema := 'clnt';
        src_table := promotion_source;
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM ctb.promotion_paths pp
        WHERE pp.source_schema = src_schema
          AND pp.source_table = src_table
          AND pp.target_schema = TG_TABLE_SCHEMA
          AND pp.target_table = TG_TABLE_NAME
          AND pp.is_active = true
    ) INTO path_exists;

    IF NOT path_exists THEN
        RAISE EXCEPTION 'CTB_PROMOTION_GATE: No registered promotion path from %.% to %.%.',
                        src_schema, src_table, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Helper: attach promotion guard to a CANONICAL table
CREATE OR REPLACE FUNCTION ctb.create_promotion_guard(p_schema TEXT, p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    trigger_name TEXT;
    full_table TEXT;
BEGIN
    trigger_name := 'trg_ctb_promotion_' || p_table;
    full_table := quote_ident(p_schema) || '.' || quote_ident(p_table);

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, full_table);
    EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %s '
        'FOR EACH ROW EXECUTE FUNCTION ctb.enforce_promotion()',
        trigger_name, full_table
    );

    RAISE NOTICE 'CTB promotion guard attached to %', full_table;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- PART 6: Immutability Enforcement (from template 005)
-- ═══════════════════════════════════════════════════════════════════

-- Vendor bridges table
CREATE TABLE IF NOT EXISTS ctb.vendor_bridges (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bridge_id           TEXT NOT NULL,
    vendor_source       TEXT NOT NULL,
    bridge_version      TEXT NOT NULL,
    target_schema       TEXT NOT NULL DEFAULT 'clnt',
    target_table        TEXT NOT NULL,
    hub_id              TEXT NOT NULL,
    subhub_id           TEXT NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    description         TEXT,
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    registered_by       TEXT NOT NULL DEFAULT current_user,

    CONSTRAINT uq_vendor_bridge UNIQUE (bridge_id)
);

COMMENT ON TABLE ctb.vendor_bridges IS 'Registered vendor bridges — each declares an allowed integration point for ingestion';

CREATE INDEX IF NOT EXISTS idx_vendor_bridges_target
    ON ctb.vendor_bridges (target_schema, target_table);

CREATE INDEX IF NOT EXISTS idx_vendor_bridges_source
    ON ctb.vendor_bridges (vendor_source);

-- Immutability enforcement trigger
CREATE OR REPLACE FUNCTION ctb.enforce_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    target_leaf_type TEXT;
BEGIN
    SELECT tr.leaf_type INTO target_leaf_type
    FROM ctb.table_registry tr
    WHERE tr.table_schema = TG_TABLE_SCHEMA
      AND tr.table_name = TG_TABLE_NAME;

    IF target_leaf_type IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- ERROR tables: allow INSERT and UPDATE, reject DELETE
    IF target_leaf_type = 'ERROR' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'CTB_IMMUTABILITY: DELETE on ERROR table %.% is not allowed.',
                            TG_TABLE_SCHEMA, TG_TABLE_NAME;
        END IF;
        RETURN NEW;
    END IF;

    -- STAGING: INSERT only
    IF target_leaf_type = 'STAGING' THEN
        IF TG_OP = 'UPDATE' THEN
            RAISE EXCEPTION 'CTB_IMMUTABILITY: UPDATE on STAGING table %.% is not allowed. '
                            'Corrections must flow through batch supersede.',
                            TG_TABLE_SCHEMA, TG_TABLE_NAME;
        END IF;
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'CTB_IMMUTABILITY: DELETE on STAGING table %.% is not allowed.',
                            TG_TABLE_SCHEMA, TG_TABLE_NAME;
        END IF;
        RETURN NEW;
    END IF;

    -- CANONICAL and SUPPORT: allow INSERT and UPDATE, reject DELETE
    IF target_leaf_type IN ('CANONICAL', 'SUPPORT') THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'CTB_IMMUTABILITY: DELETE on %.% (leaf_type=%) is not allowed.',
                            TG_TABLE_SCHEMA, TG_TABLE_NAME, target_leaf_type;
        END IF;
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- MV, REGISTRY: INSERT only
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'CTB_IMMUTABILITY: UPDATE on %.% (leaf_type=%) is not allowed.',
                        TG_TABLE_SCHEMA, TG_TABLE_NAME, target_leaf_type;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'CTB_IMMUTABILITY: DELETE on %.% (leaf_type=%) is not allowed.',
                        TG_TABLE_SCHEMA, TG_TABLE_NAME, target_leaf_type;
    END IF;

    RETURN NEW;
END;
$$;

-- Helper: attach immutability guard
CREATE OR REPLACE FUNCTION ctb.create_immutability_guard(p_schema TEXT, p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    trigger_name TEXT;
    full_table TEXT;
BEGIN
    trigger_name := 'trg_ctb_immutability_' || p_table;
    full_table := quote_ident(p_schema) || '.' || quote_ident(p_table);

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, full_table);
    EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %s '
        'FOR EACH ROW EXECUTE FUNCTION ctb.enforce_immutability()',
        trigger_name, full_table
    );

    RAISE NOTICE 'CTB immutability guard attached to %', full_table;
END;
$$;

-- Helper: remove immutability guard
CREATE OR REPLACE FUNCTION ctb.remove_immutability_guard(p_schema TEXT, p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
DECLARE
    trigger_name TEXT;
    full_table TEXT;
BEGIN
    trigger_name := 'trg_ctb_immutability_' || p_table;
    full_table := quote_ident(p_schema) || '.' || quote_ident(p_table);

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_name, full_table);
    RAISE NOTICE 'CTB immutability guard removed from %', full_table;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- PART 7: Attach Guards to All Existing Tables
-- ═══════════════════════════════════════════════════════════════════

-- Write guards on all 14 tables
SELECT ctb.create_write_guard('clnt', 'client_hub');
SELECT ctb.create_write_guard('clnt', 'client_master');
SELECT ctb.create_write_guard('clnt', 'client_projection');
SELECT ctb.create_write_guard('clnt', 'plan');
SELECT ctb.create_write_guard('clnt', 'plan_quote');
SELECT ctb.create_write_guard('clnt', 'person');
SELECT ctb.create_write_guard('clnt', 'election');
SELECT ctb.create_write_guard('clnt', 'intake_batch');
SELECT ctb.create_write_guard('clnt', 'intake_record');
SELECT ctb.create_write_guard('clnt', 'vendor');
SELECT ctb.create_write_guard('clnt', 'external_identity_map');
SELECT ctb.create_write_guard('clnt', 'service_request');
SELECT ctb.create_write_guard('clnt', 'compliance_flag');
SELECT ctb.create_write_guard('clnt', 'audit_event');

-- Immutability guards on all 14 tables
SELECT ctb.create_immutability_guard('clnt', 'client_hub');
SELECT ctb.create_immutability_guard('clnt', 'client_master');
SELECT ctb.create_immutability_guard('clnt', 'client_projection');
SELECT ctb.create_immutability_guard('clnt', 'plan');
SELECT ctb.create_immutability_guard('clnt', 'plan_quote');
SELECT ctb.create_immutability_guard('clnt', 'person');
SELECT ctb.create_immutability_guard('clnt', 'election');
SELECT ctb.create_immutability_guard('clnt', 'intake_batch');
SELECT ctb.create_immutability_guard('clnt', 'intake_record');
SELECT ctb.create_immutability_guard('clnt', 'vendor');
SELECT ctb.create_immutability_guard('clnt', 'external_identity_map');
SELECT ctb.create_immutability_guard('clnt', 'service_request');
SELECT ctb.create_immutability_guard('clnt', 'compliance_flag');
SELECT ctb.create_immutability_guard('clnt', 'audit_event');

-- Promotion guards on CANONICAL tables only
-- (person and plan have promotion paths from staging/support tables)
SELECT ctb.create_promotion_guard('clnt', 'person');
SELECT ctb.create_promotion_guard('clnt', 'election');
SELECT ctb.create_promotion_guard('clnt', 'plan');


-- ═══════════════════════════════════════════════════════════════════
-- PART 8: Application Role (from template 011)
-- ═══════════════════════════════════════════════════════════════════

-- Create the non-superuser application role
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ctb_app_role') THEN
        CREATE ROLE ctb_app_role NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;
END $$;

COMMENT ON ROLE ctb_app_role IS 'Non-superuser application role — all app code must run through this role for governance triggers to fire';

-- Validation function
CREATE OR REPLACE FUNCTION ctb.validate_application_role()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    detail TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ctb, pg_catalog
AS $$
BEGIN
    -- Check 1: ctb_app_role exists
    RETURN QUERY
    SELECT 'ctb_app_role_exists'::TEXT,
           CASE WHEN EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'ctb_app_role')
                THEN 'PASS' ELSE 'FAIL' END,
           'Role ctb_app_role must exist'::TEXT;

    -- Check 2: Current user is not postgres
    RETURN QUERY
    SELECT 'current_user_not_postgres'::TEXT,
           CASE WHEN current_user != 'postgres'
                THEN 'PASS' ELSE 'FAIL' END,
           format('Current user: %s', current_user)::TEXT;

    -- Check 3: Current user is not superuser
    RETURN QUERY
    SELECT 'current_user_not_superuser'::TEXT,
           CASE WHEN NOT EXISTS(
               SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolsuper = true
           ) THEN 'PASS' ELSE 'FAIL' END,
           'Application should not connect as superuser'::TEXT;

    -- Check 4: ctb_app_role is not superuser
    RETURN QUERY
    SELECT 'ctb_app_role_not_superuser'::TEXT,
           CASE WHEN NOT EXISTS(
               SELECT 1 FROM pg_roles WHERE rolname = 'ctb_app_role' AND rolsuper = true
           ) THEN 'PASS' ELSE 'FAIL' END,
           'ctb_app_role must not be superuser'::TEXT;
END;
$$;

COMMENT ON FUNCTION ctb.validate_application_role() IS 'Validates application role configuration for governance trigger enforcement';


-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════
-- Expected: 14 rows in ctb.table_registry (all clnt tables)
-- Expected: ctb schema with 5 tables:
--   table_registry, registry_audit_log, promotion_paths, vendor_bridges
-- Expected: 2 event triggers (DDL gate)
-- Expected: Write guards on all 14 clnt tables
-- Expected: Immutability guards on all 14 clnt tables
-- Expected: Promotion guards on person, election, plan
-- Expected: ctb_app_role role exists


-- ═══════════════════════════════════════════════════════════════════
-- ROLLBACK (uncomment to reverse this migration)
-- ═══════════════════════════════════════════════════════════════════
-- NOTE: Must remove guards before dropping functions
--
-- SELECT ctb.remove_write_guard('clnt', t) FROM unnest(ARRAY[
--   'client_hub','client_master','client_projection','plan','plan_quote',
--   'person','election','intake_batch','intake_record','vendor',
--   'external_identity_map','service_request','compliance_flag','audit_event'
-- ]) t;
--
-- SELECT ctb.remove_immutability_guard('clnt', t) FROM unnest(ARRAY[
--   'client_hub','client_master','client_projection','plan','plan_quote',
--   'person','election','intake_batch','intake_record','vendor',
--   'external_identity_map','service_request','compliance_flag','audit_event'
-- ]) t;
--
-- DROP EVENT TRIGGER IF EXISTS ctb_enforce_table_registration;
-- DROP EVENT TRIGGER IF EXISTS ctb_enforce_table_drop;
-- DROP FUNCTION IF EXISTS ctb.validate_application_role();
-- DROP FUNCTION IF EXISTS ctb.remove_immutability_guard(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS ctb.create_immutability_guard(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS ctb.enforce_immutability();
-- DROP FUNCTION IF EXISTS ctb.create_promotion_guard(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS ctb.enforce_promotion();
-- DROP FUNCTION IF EXISTS ctb.remove_write_guard(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS ctb.create_write_guard(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS ctb.write_guard_check();
-- DROP FUNCTION IF EXISTS ctb.enforce_table_drop_registration();
-- DROP FUNCTION IF EXISTS ctb.enforce_table_registration();
-- DROP FUNCTION IF EXISTS ctb.audit_registry_changes();
-- DROP TABLE IF EXISTS ctb.vendor_bridges;
-- DROP TABLE IF EXISTS ctb.promotion_paths;
-- DROP TABLE IF EXISTS ctb.registry_audit_log;
-- DROP TABLE IF EXISTS ctb.table_registry;
-- DROP SCHEMA IF EXISTS ctb;
-- DROP ROLE IF EXISTS ctb_app_role;
