// S5-SERVICE: Service — Service Ticket Tracking & Dashboards
// Schema: clnt | Spoke: s5-service
// Tables: service_request, service_error
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

/**
 * clnt.service_request — Service ticket tracking. Will grow to support dashboard features.
 * Leaf Type: CANONICAL
 * PK: service_request_id
 * FK: client.client_id
 */
export interface ServiceRequest {
  /** @column clnt.service_request.service_request_id — Primary key. Auto-generated UUID. */
  service_request_id: string;

  /** @column clnt.service_request.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.service_request.category — Request category (enrollment, billing, general, etc.). */
  category: string;

  /** @column clnt.service_request.status — Request lifecycle state (open, in_progress, resolved, closed). */
  status: string;

  /** @column clnt.service_request.opened_at — When the request was opened. Auto-set. */
  opened_at: string;

  /** @column clnt.service_request.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.service_request.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.service_error — Service-level error tracking. Captures failures in service request processing.
 * Leaf Type: ERROR
 * PK: service_error_id
 * FK: client.client_id
 */
export interface ServiceError {
  /** @column clnt.service_error.service_error_id — Primary key. Auto-generated UUID. */
  service_error_id: string;

  /** @column clnt.service_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.service_error.source_entity — Table or process that produced the error. */
  source_entity: string;

  /** @column clnt.service_error.source_id — UUID of the entity that caused the error. */
  source_id: string | null;

  /** @column clnt.service_error.error_code — Machine-readable error code. */
  error_code: string;

  /** @column clnt.service_error.error_message — Human-readable error description. */
  error_message: string;

  /** @column clnt.service_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: string;

  /** @column clnt.service_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: string;

  /** @column clnt.service_error.context — Additional error context and metadata. */
  context: Record<string, unknown> | null;

  /** @column clnt.service_error.created_at — Record creation timestamp. Append-only. */
  created_at: string;

}
