// S1-HUB: Hub — Client Identity & Configuration
// Schema: clnt | Spoke: s1-hub
// Tables: client, client_error
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

/**
 * clnt.client — Canonical client record. Sovereign identity + business details + UI projection config.
 * Leaf Type: CANONICAL
 * PK: client_id
 */
export interface Client {
  /** @column clnt.client.client_id — Sovereign identity. Immutable UUID primary key. Universal join key. */
  client_id: string;

  /** @column clnt.client.legal_name — Legal company name as registered. */
  legal_name: string;

  /** @column clnt.client.fein — Federal Employer Identification Number. */
  fein: string | null;

  /** @column clnt.client.domicile_state — Two-letter state code of legal domicile. */
  domicile_state: string | null;

  /** @column clnt.client.effective_date — Client effective date for coverage. */
  effective_date: string | null;

  /** @column clnt.client.status — Client lifecycle state (active, terminated, suspended). */
  status: string;

  /** @column clnt.client.source — Origin system identifier (manual, api, migration). */
  source: string | null;

  /** @column clnt.client.version — Record version counter for optimistic concurrency. */
  version: number;

  /** @column clnt.client.domain — Custom domain for client portal. */
  domain: string | null;

  /** @column clnt.client.label_override — Display name override for UI rendering. */
  label_override: string | null;

  /** @column clnt.client.logo_url — Client logo URL for branding. */
  logo_url: string | null;

  /** @column clnt.client.color_primary — Primary brand color (hex). */
  color_primary: string | null;

  /** @column clnt.client.color_accent — Accent brand color (hex). */
  color_accent: string | null;

  /** @column clnt.client.feature_flags — Feature toggle configuration. */
  feature_flags: Record<string, unknown>;

  /** @column clnt.client.dashboard_blocks — Dashboard block layout configuration. */
  dashboard_blocks: unknown[];

  /** @column clnt.client.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.client.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.client_error — Client-level error tracking. Captures processing failures for client operations.
 * Leaf Type: ERROR
 * PK: client_error_id
 * FK: client.client_id
 */
export interface ClientError {
  /** @column clnt.client_error.client_error_id — Primary key. Auto-generated UUID. */
  client_error_id: string;

  /** @column clnt.client_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.client_error.source_entity — Table or process that produced the error. */
  source_entity: string;

  /** @column clnt.client_error.source_id — UUID of the entity that caused the error. Nullable if system-level. */
  source_id: string | null;

  /** @column clnt.client_error.error_code — Machine-readable error code for programmatic handling. */
  error_code: string;

  /** @column clnt.client_error.error_message — Human-readable error description. */
  error_message: string;

  /** @column clnt.client_error.severity — Error severity level. CHECK: warning, error, critical. */
  severity: string;

  /** @column clnt.client_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: string;

  /** @column clnt.client_error.context — Additional error context and metadata. */
  context: Record<string, unknown> | null;

  /** @column clnt.client_error.created_at — Record creation timestamp. Append-only. */
  created_at: string;

}
