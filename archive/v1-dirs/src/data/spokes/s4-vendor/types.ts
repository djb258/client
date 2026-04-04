// S4-VENDOR: Vendor — Vendor Identity & Billing
// Schema: clnt | Spoke: s4-vendor
// Tables: vendor, vendor_error, external_identity_map, invoice
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

/**
 * clnt.vendor — Vendor identity per client.
 * Leaf Type: CANONICAL
 * PK: vendor_id
 * FK: client.client_id
 */
export interface Vendor {
  /** @column clnt.vendor.vendor_id — Primary key. Auto-generated UUID. */
  vendor_id: string;

  /** @column clnt.vendor.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.vendor.vendor_name — Vendor display name. */
  vendor_name: string;

  /** @column clnt.vendor.vendor_type — Vendor classification (carrier, tpa, broker, etc.). */
  vendor_type: string | null;

  /** @column clnt.vendor.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.vendor.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.vendor_error — Vendor-level error tracking. Captures failures in vendor integrations, ID mapping, invoice processing.
 * Leaf Type: ERROR
 * PK: vendor_error_id
 * FK: client.client_id
 */
export interface VendorError {
  /** @column clnt.vendor_error.vendor_error_id — Primary key. Auto-generated UUID. */
  vendor_error_id: string;

  /** @column clnt.vendor_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.vendor_error.source_entity — Table or process that produced the error. */
  source_entity: string;

  /** @column clnt.vendor_error.source_id — UUID of the entity that caused the error. */
  source_id: string | null;

  /** @column clnt.vendor_error.error_code — Machine-readable error code. */
  error_code: string;

  /** @column clnt.vendor_error.error_message — Human-readable error description. */
  error_message: string;

  /** @column clnt.vendor_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: string;

  /** @column clnt.vendor_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: string;

  /** @column clnt.vendor_error.context — Additional error context and metadata. */
  context: Record<string, unknown> | null;

  /** @column clnt.vendor_error.created_at — Record creation timestamp. Append-only. */
  created_at: string;

}

/**
 * clnt.external_identity_map — Internal-to-external ID translation. External IDs never replace internal UUIDs.
 * Leaf Type: SUPPORT
 * PK: external_identity_id
 * FK: client.client_id, vendor.vendor_id
 */
export interface ExternalIdentityMap {
  /** @column clnt.external_identity_map.external_identity_id — Primary key. Auto-generated UUID. */
  external_identity_id: string;

  /** @column clnt.external_identity_map.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.external_identity_map.entity_type — What entity is mapped. CHECK: person, plan. */
  entity_type: string;

  /** @column clnt.external_identity_map.internal_id — Internal entity UUID being mapped. */
  internal_id: string;

  /** @column clnt.external_identity_map.vendor_id — FK to clnt.vendor. Which vendor owns this external ID. */
  vendor_id: string;

  /** @column clnt.external_identity_map.external_id_value — The vendor's external identifier value. */
  external_id_value: string;

  /** @column clnt.external_identity_map.effective_date — Effective date of this mapping. */
  effective_date: string | null;

  /** @column clnt.external_identity_map.status — Mapping lifecycle state (active, inactive). */
  status: string;

  /** @column clnt.external_identity_map.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.external_identity_map.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.invoice — Vendor invoices tied to a client. Tracks billing from vendors.
 * Leaf Type: SUPPORT
 * PK: invoice_id
 * FK: client.client_id, vendor.vendor_id
 */
export interface Invoice {
  /** @column clnt.invoice.invoice_id — Primary key. Auto-generated UUID. */
  invoice_id: string;

  /** @column clnt.invoice.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.invoice.vendor_id — FK to clnt.vendor. Vendor that issued this invoice. */
  vendor_id: string;

  /** @column clnt.invoice.invoice_number — Vendor's invoice reference number. */
  invoice_number: string;

  /** @column clnt.invoice.amount — Invoice total amount. */
  amount: string;

  /** @column clnt.invoice.invoice_date — Date on the invoice. */
  invoice_date: string;

  /** @column clnt.invoice.due_date — Payment due date. */
  due_date: string | null;

  /** @column clnt.invoice.status — Invoice lifecycle. CHECK: received, approved, paid, disputed. */
  status: string;

  /** @column clnt.invoice.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.invoice.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}
