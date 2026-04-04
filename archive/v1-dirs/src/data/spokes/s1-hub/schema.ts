// S1-HUB: Hub — Client Identity & Configuration
// Zod write schemas generated from column registry
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

import { z } from 'zod';

/** Insert schema for clnt.client (CANONICAL) */
export const ClientInsert = z.object({
  /** @column clnt.client.legal_name — Legal company name as registered. */
  legal_name: z.string().describe('clnt.client.legal_name'),
  /** @column clnt.client.fein — Federal Employer Identification Number. */
  fein: z.string().nullable().describe('clnt.client.fein'),
  /** @column clnt.client.domicile_state — Two-letter state code of legal domicile. */
  domicile_state: z.string().nullable().describe('clnt.client.domicile_state'),
  /** @column clnt.client.effective_date — Client effective date for coverage. */
  effective_date: z.string().date().nullable().describe('clnt.client.effective_date'),
  /** @column clnt.client.status — Client lifecycle state (active, terminated, suspended). */
  status: z.string().optional().describe('clnt.client.status'),
  /** @column clnt.client.source — Origin system identifier (manual, api, migration). */
  source: z.string().nullable().describe('clnt.client.source'),
  /** @column clnt.client.version — Record version counter for optimistic concurrency. */
  version: z.number().int().optional().describe('clnt.client.version'),
  /** @column clnt.client.domain — Custom domain for client portal. */
  domain: z.string().nullable().describe('clnt.client.domain'),
  /** @column clnt.client.label_override — Display name override for UI rendering. */
  label_override: z.string().nullable().describe('clnt.client.label_override'),
  /** @column clnt.client.logo_url — Client logo URL for branding. */
  logo_url: z.string().nullable().describe('clnt.client.logo_url'),
  /** @column clnt.client.color_primary — Primary brand color (hex). */
  color_primary: z.string().nullable().describe('clnt.client.color_primary'),
  /** @column clnt.client.color_accent — Accent brand color (hex). */
  color_accent: z.string().nullable().describe('clnt.client.color_accent'),
  /** @column clnt.client.feature_flags — Feature toggle configuration. */
  feature_flags: z.record(z.string(), z.unknown()).optional().describe('clnt.client.feature_flags'),
  /** @column clnt.client.dashboard_blocks — Dashboard block layout configuration. */
  dashboard_blocks: z.array(z.unknown()).optional().describe('clnt.client.dashboard_blocks'),
});
export type ClientInsertInput = z.infer<typeof ClientInsert>;

/** Update schema for clnt.client (CANONICAL) */
export const ClientUpdate = z.object({
  /** @column clnt.client.legal_name — Legal company name as registered. */
  legal_name: z.string().optional().describe('clnt.client.legal_name'),
  /** @column clnt.client.fein — Federal Employer Identification Number. */
  fein: z.string().nullable().optional().describe('clnt.client.fein'),
  /** @column clnt.client.domicile_state — Two-letter state code of legal domicile. */
  domicile_state: z.string().nullable().optional().describe('clnt.client.domicile_state'),
  /** @column clnt.client.effective_date — Client effective date for coverage. */
  effective_date: z.string().date().nullable().optional().describe('clnt.client.effective_date'),
  /** @column clnt.client.status — Client lifecycle state (active, terminated, suspended). */
  status: z.string().optional().describe('clnt.client.status'),
  /** @column clnt.client.source — Origin system identifier (manual, api, migration). */
  source: z.string().nullable().optional().describe('clnt.client.source'),
  /** @column clnt.client.version — Record version counter for optimistic concurrency. */
  version: z.number().int().optional().describe('clnt.client.version'),
  /** @column clnt.client.domain — Custom domain for client portal. */
  domain: z.string().nullable().optional().describe('clnt.client.domain'),
  /** @column clnt.client.label_override — Display name override for UI rendering. */
  label_override: z.string().nullable().optional().describe('clnt.client.label_override'),
  /** @column clnt.client.logo_url — Client logo URL for branding. */
  logo_url: z.string().nullable().optional().describe('clnt.client.logo_url'),
  /** @column clnt.client.color_primary — Primary brand color (hex). */
  color_primary: z.string().nullable().optional().describe('clnt.client.color_primary'),
  /** @column clnt.client.color_accent — Accent brand color (hex). */
  color_accent: z.string().nullable().optional().describe('clnt.client.color_accent'),
  /** @column clnt.client.feature_flags — Feature toggle configuration. */
  feature_flags: z.record(z.string(), z.unknown()).optional().describe('clnt.client.feature_flags'),
  /** @column clnt.client.dashboard_blocks — Dashboard block layout configuration. */
  dashboard_blocks: z.array(z.unknown()).optional().describe('clnt.client.dashboard_blocks'),
});
export type ClientUpdateInput = z.infer<typeof ClientUpdate>;

/** Insert schema for clnt.client_error (ERROR) */
export const ClientErrorInsert = z.object({
  /** @column clnt.client_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.client_error.client_id'),
  /** @column clnt.client_error.source_entity — Table or process that produced the error. */
  source_entity: z.string().describe('clnt.client_error.source_entity'),
  /** @column clnt.client_error.source_id — UUID of the entity that caused the error. Nullable if system-level. */
  source_id: z.string().uuid().nullable().describe('clnt.client_error.source_id'),
  /** @column clnt.client_error.error_code — Machine-readable error code for programmatic handling. */
  error_code: z.string().describe('clnt.client_error.error_code'),
  /** @column clnt.client_error.error_message — Human-readable error description. */
  error_message: z.string().describe('clnt.client_error.error_message'),
  /** @column clnt.client_error.severity — Error severity level. CHECK: warning, error, critical. */
  severity: z.string().optional().describe('clnt.client_error.severity'),
  /** @column clnt.client_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: z.string().optional().describe('clnt.client_error.status'),
  /** @column clnt.client_error.context — Additional error context and metadata. */
  context: z.record(z.string(), z.unknown()).nullable().describe('clnt.client_error.context'),
});
export type ClientErrorInsertInput = z.infer<typeof ClientErrorInsert>;
