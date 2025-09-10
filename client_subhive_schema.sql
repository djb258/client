-- =========================================
-- New Client Data Schema (30k-ft IMO skeleton)
-- Target: Postgres 15+ (Neon)
-- Change this once to rename the schemas:
-- =========================================
-- \set schema_base clnt2
-- If your psql doesn't use \set, just search/replace clnt2 -> your name

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Schemas
CREATE SCHEMA IF NOT EXISTS clnt2;
CREATE SCHEMA IF NOT EXISTS clnt2_i_src;  -- per-platform input staging (views or UNLOGGED tables)

-- ============ INPUT (I) ============
-- Durable landing + mapping registry (no business columns yet)
CREATE TABLE IF NOT EXISTS clnt2.clnt_i_raw_input (
  raw_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  source_system TEXT,
  source_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_i_profile (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT,
  source_version TEXT,
  profile_name TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ MIDDLE (M) ============
-- Static, system-locked structures (skeleton PKs + obvious FK placeholders)
CREATE TABLE IF NOT EXISTS clnt2.clnt_m_client (
  client_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_m_person (
  person_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  role TEXT,
  employee_of_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_m_plan (
  plan_uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_m_plan_cost (
  plan_cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_m_election (
  election_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_uid UUID,
  plan_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_m_vendor_link (
  link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  person_uid UUID,
  plan_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_m_spd (
  spd_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ OUTPUT (O) ============
CREATE TABLE IF NOT EXISTS clnt2.clnt_o_output (
  output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_o_output_run (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clnt2.clnt_o_compliance (
  compliance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);