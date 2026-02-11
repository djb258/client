-- ===================================================================
-- Migration: 20_ctb_consolidated_backbone.sql
-- Schema: clnt (CTB Consolidated Client Infrastructure)
-- ADR: ADR-002-ctb-consolidated-backbone
-- Created: 2026-02-11
-- ===================================================================
-- PURPOSE: Single consolidated schema with 12 tables (S1-S8 spokes)
-- RULES:
--   - client_id is sovereign identity (UUID FK everywhere)
--   - All PKs are UUID via gen_random_uuid()
--   - No composite PKs
--   - Hub is read-only after creation
--   - Leaf-only writes
--   - Intake → Vault is one-way
--   - External IDs never replace internal UUIDs
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS clnt;

-- ===================================================================
-- TRIGGER FUNCTION: updated_at auto-stamp
-- ===================================================================
CREATE OR REPLACE FUNCTION clnt.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ===================================================================
-- S1: HUB — Root Identity (read-only after creation)
-- ===================================================================
CREATE TABLE clnt.client_hub (
    client_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          TEXT NOT NULL DEFAULT 'active',
    source          TEXT,
    version         INT NOT NULL DEFAULT 1
);

COMMENT ON TABLE clnt.client_hub IS 'S1 Hub: Root client identity. Read-only after creation.';


-- ===================================================================
-- S1: CLIENT MASTER — Legal/business details
-- ===================================================================
CREATE TABLE clnt.client_master (
    client_id       UUID PRIMARY KEY REFERENCES clnt.client_hub(client_id),
    legal_name      TEXT NOT NULL,
    fein            TEXT,
    domicile_state  TEXT,
    effective_date  DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_master_fein ON clnt.client_master(fein);
CREATE INDEX idx_client_master_state ON clnt.client_master(domicile_state);

COMMENT ON TABLE clnt.client_master IS 'S1 Master: Client legal identity. PK is FK to client_hub.';

CREATE TRIGGER trg_client_master_updated_at
    BEFORE UPDATE ON clnt.client_master
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S2: PLAN — Consolidated with fixed cost tiers
-- ===================================================================
CREATE TABLE clnt.plan (
    plan_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    benefit_type    TEXT NOT NULL,
    carrier_id      TEXT,
    effective_date  DATE,
    status          TEXT NOT NULL DEFAULT 'active',
    version         INT NOT NULL DEFAULT 1,

    -- Fixed cost tiers (employee contribution)
    rate_ee         NUMERIC(10,2),
    rate_es         NUMERIC(10,2),
    rate_ec         NUMERIC(10,2),
    rate_fam        NUMERIC(10,2),

    -- Fixed cost tiers (employer contribution)
    employer_rate_ee  NUMERIC(10,2),
    employer_rate_es  NUMERIC(10,2),
    employer_rate_ec  NUMERIC(10,2),
    employer_rate_fam NUMERIC(10,2),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_client ON clnt.plan(client_id);
CREATE INDEX idx_plan_benefit_type ON clnt.plan(benefit_type);
CREATE INDEX idx_plan_status ON clnt.plan(status);

COMMENT ON TABLE clnt.plan IS 'S2 Plan: One row per plan. Fixed 4-tier cost structure embedded. No separate plan_cost table.';

CREATE TRIGGER trg_plan_updated_at
    BEFORE UPDATE ON clnt.plan
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S3: ENROLLMENT INTAKE — Staging only
-- ===================================================================
CREATE TABLE clnt.intake_batch (
    intake_batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    upload_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intake_batch_client ON clnt.intake_batch(client_id);
CREATE INDEX idx_intake_batch_status ON clnt.intake_batch(status);

COMMENT ON TABLE clnt.intake_batch IS 'S3 Intake: Batch upload header. Staging only.';

CREATE TRIGGER trg_intake_batch_updated_at
    BEFORE UPDATE ON clnt.intake_batch
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


CREATE TABLE clnt.intake_record (
    intake_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    intake_batch_id  UUID NOT NULL REFERENCES clnt.intake_batch(intake_batch_id),
    raw_payload      JSONB NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intake_record_client ON clnt.intake_record(client_id);
CREATE INDEX idx_intake_record_batch ON clnt.intake_record(intake_batch_id);

COMMENT ON TABLE clnt.intake_record IS 'S3 Intake: Individual raw records within a batch. No logic, no state.';


-- ===================================================================
-- S4: ENROLLMENT VAULT — Person + Election (bridge)
-- ===================================================================
CREATE TABLE clnt.person (
    person_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    ssn_hash        TEXT,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_person_client ON clnt.person(client_id);
CREATE INDEX idx_person_status ON clnt.person(status);
CREATE INDEX idx_person_ssn_hash ON clnt.person(ssn_hash);

COMMENT ON TABLE clnt.person IS 'S4 Vault: Employee/dependent identity. Never stores raw SSN.';

CREATE TRIGGER trg_person_updated_at
    BEFORE UPDATE ON clnt.person
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


CREATE TABLE clnt.election (
    election_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    person_id       UUID NOT NULL REFERENCES clnt.person(person_id),
    plan_id         UUID NOT NULL REFERENCES clnt.plan(plan_id),
    coverage_tier   TEXT NOT NULL CHECK (coverage_tier IN ('EE', 'ES', 'EC', 'FAM')),
    effective_date  DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_election_client ON clnt.election(client_id);
CREATE INDEX idx_election_person ON clnt.election(person_id);
CREATE INDEX idx_election_plan ON clnt.election(plan_id);

COMMENT ON TABLE clnt.election IS 'S4 Vault: Benefit election bridge. Links person to plan with tier. Never merge with person.';

CREATE TRIGGER trg_election_updated_at
    BEFORE UPDATE ON clnt.election
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S5: VENDOR + IDENTITY MAP
-- ===================================================================
CREATE TABLE clnt.vendor (
    vendor_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    vendor_name     TEXT NOT NULL,
    vendor_type     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_client ON clnt.vendor(client_id);

COMMENT ON TABLE clnt.vendor IS 'S5 Vendor: Vendor identity per client.';

CREATE TRIGGER trg_vendor_updated_at
    BEFORE UPDATE ON clnt.vendor
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


CREATE TABLE clnt.external_identity_map (
    external_identity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id            UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    entity_type          TEXT NOT NULL CHECK (entity_type IN ('person', 'plan')),
    internal_id          UUID NOT NULL,
    vendor_id            UUID NOT NULL REFERENCES clnt.vendor(vendor_id),
    external_id_value    TEXT NOT NULL,
    effective_date       DATE,
    status               TEXT NOT NULL DEFAULT 'active',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ext_id_client ON clnt.external_identity_map(client_id);
CREATE INDEX idx_ext_id_vendor ON clnt.external_identity_map(vendor_id);
CREATE INDEX idx_ext_id_internal ON clnt.external_identity_map(internal_id);
CREATE INDEX idx_ext_id_entity_type ON clnt.external_identity_map(entity_type);

COMMENT ON TABLE clnt.external_identity_map IS 'S5 Vendor: Internal-to-external ID translation. External IDs never replace internal UUIDs.';

CREATE TRIGGER trg_external_identity_map_updated_at
    BEFORE UPDATE ON clnt.external_identity_map
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S6: SERVICE
-- ===================================================================
CREATE TABLE clnt.service_request (
    service_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id          UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    category           TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'open',
    opened_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_request_client ON clnt.service_request(client_id);
CREATE INDEX idx_service_request_status ON clnt.service_request(status);

COMMENT ON TABLE clnt.service_request IS 'S6 Service: Service ticket tracking.';

CREATE TRIGGER trg_service_request_updated_at
    BEFORE UPDATE ON clnt.service_request
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S7: COMPLIANCE
-- ===================================================================
CREATE TABLE clnt.compliance_flag (
    compliance_flag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id          UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    flag_type          TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'open',
    effective_date     DATE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_flag_client ON clnt.compliance_flag(client_id);
CREATE INDEX idx_compliance_flag_status ON clnt.compliance_flag(status);

COMMENT ON TABLE clnt.compliance_flag IS 'S7 Compliance: Compliance flag tracking per client.';

CREATE TRIGGER trg_compliance_flag_updated_at
    BEFORE UPDATE ON clnt.compliance_flag
    FOR EACH ROW EXECUTE FUNCTION clnt.set_updated_at();


-- ===================================================================
-- S8: AUDIT — System write only
-- ===================================================================
CREATE TABLE clnt.audit_event (
    audit_event_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clnt.client_hub(client_id),
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    action          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_event_client ON clnt.audit_event(client_id);
CREATE INDEX idx_audit_event_entity ON clnt.audit_event(entity_type, entity_id);
CREATE INDEX idx_audit_event_action ON clnt.audit_event(action);
CREATE INDEX idx_audit_event_created ON clnt.audit_event(created_at);

COMMENT ON TABLE clnt.audit_event IS 'S8 Audit: Append-only system audit trail. No updates, no deletes.';


-- ===================================================================
-- VERIFICATION
-- ===================================================================
-- Expected: 12 tables in clnt schema
-- S1: client_hub, client_master
-- S2: plan
-- S3: intake_batch, intake_record
-- S4: person, election
-- S5: vendor, external_identity_map
-- S6: service_request
-- S7: compliance_flag
-- S8: audit_event
