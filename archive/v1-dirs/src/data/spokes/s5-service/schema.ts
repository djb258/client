// S5-SERVICE: Service — Service Ticket Tracking & Dashboards
// Zod write schemas generated from column registry
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

import { z } from 'zod';

/** Insert schema for clnt.service_request (CANONICAL) */
export const ServiceRequestInsert = z.object({
  /** @column clnt.service_request.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.service_request.client_id'),
  /** @column clnt.service_request.category — Request category (enrollment, billing, general, etc.). */
  category: z.string().describe('clnt.service_request.category'),
  /** @column clnt.service_request.status — Request lifecycle state (open, in_progress, resolved, closed). */
  status: z.string().optional().describe('clnt.service_request.status'),
});
export type ServiceRequestInsertInput = z.infer<typeof ServiceRequestInsert>;

/** Update schema for clnt.service_request (CANONICAL) */
export const ServiceRequestUpdate = z.object({
  /** @column clnt.service_request.category — Request category (enrollment, billing, general, etc.). */
  category: z.string().optional().describe('clnt.service_request.category'),
  /** @column clnt.service_request.status — Request lifecycle state (open, in_progress, resolved, closed). */
  status: z.string().optional().describe('clnt.service_request.status'),
});
export type ServiceRequestUpdateInput = z.infer<typeof ServiceRequestUpdate>;

/** Insert schema for clnt.service_error (ERROR) */
export const ServiceErrorInsert = z.object({
  /** @column clnt.service_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.service_error.client_id'),
  /** @column clnt.service_error.source_entity — Table or process that produced the error. */
  source_entity: z.string().describe('clnt.service_error.source_entity'),
  /** @column clnt.service_error.source_id — UUID of the entity that caused the error. */
  source_id: z.string().uuid().nullable().describe('clnt.service_error.source_id'),
  /** @column clnt.service_error.error_code — Machine-readable error code. */
  error_code: z.string().describe('clnt.service_error.error_code'),
  /** @column clnt.service_error.error_message — Human-readable error description. */
  error_message: z.string().describe('clnt.service_error.error_message'),
  /** @column clnt.service_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: z.string().optional().describe('clnt.service_error.severity'),
  /** @column clnt.service_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: z.string().optional().describe('clnt.service_error.status'),
  /** @column clnt.service_error.context — Additional error context and metadata. */
  context: z.record(z.string(), z.unknown()).nullable().describe('clnt.service_error.context'),
});
export type ServiceErrorInsertInput = z.infer<typeof ServiceErrorInsert>;
