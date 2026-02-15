// S4-VENDOR: Vendor — Vendor Identity & Billing
// Zod write schemas generated from column registry
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

import { z } from 'zod';

/** Insert schema for clnt.vendor (CANONICAL) */
export const VendorInsert = z.object({
  /** @column clnt.vendor.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.vendor.client_id'),
  /** @column clnt.vendor.vendor_name — Vendor display name. */
  vendor_name: z.string().describe('clnt.vendor.vendor_name'),
  /** @column clnt.vendor.vendor_type — Vendor classification (carrier, tpa, broker, etc.). */
  vendor_type: z.string().nullable().describe('clnt.vendor.vendor_type'),
});
export type VendorInsertInput = z.infer<typeof VendorInsert>;

/** Update schema for clnt.vendor (CANONICAL) */
export const VendorUpdate = z.object({
  /** @column clnt.vendor.vendor_name — Vendor display name. */
  vendor_name: z.string().optional().describe('clnt.vendor.vendor_name'),
  /** @column clnt.vendor.vendor_type — Vendor classification (carrier, tpa, broker, etc.). */
  vendor_type: z.string().nullable().optional().describe('clnt.vendor.vendor_type'),
});
export type VendorUpdateInput = z.infer<typeof VendorUpdate>;

/** Insert schema for clnt.vendor_error (ERROR) */
export const VendorErrorInsert = z.object({
  /** @column clnt.vendor_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.vendor_error.client_id'),
  /** @column clnt.vendor_error.source_entity — Table or process that produced the error. */
  source_entity: z.string().describe('clnt.vendor_error.source_entity'),
  /** @column clnt.vendor_error.source_id — UUID of the entity that caused the error. */
  source_id: z.string().uuid().nullable().describe('clnt.vendor_error.source_id'),
  /** @column clnt.vendor_error.error_code — Machine-readable error code. */
  error_code: z.string().describe('clnt.vendor_error.error_code'),
  /** @column clnt.vendor_error.error_message — Human-readable error description. */
  error_message: z.string().describe('clnt.vendor_error.error_message'),
  /** @column clnt.vendor_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: z.string().optional().describe('clnt.vendor_error.severity'),
  /** @column clnt.vendor_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: z.string().optional().describe('clnt.vendor_error.status'),
  /** @column clnt.vendor_error.context — Additional error context and metadata. */
  context: z.record(z.string(), z.unknown()).nullable().describe('clnt.vendor_error.context'),
});
export type VendorErrorInsertInput = z.infer<typeof VendorErrorInsert>;

/** Insert schema for clnt.external_identity_map (SUPPORT) */
export const ExternalIdentityMapInsert = z.object({
  /** @column clnt.external_identity_map.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.external_identity_map.client_id'),
  /** @column clnt.external_identity_map.entity_type — What entity is mapped. CHECK: person, plan. */
  entity_type: z.string().describe('clnt.external_identity_map.entity_type'),
  /** @column clnt.external_identity_map.internal_id — Internal entity UUID being mapped. */
  internal_id: z.string().uuid().describe('clnt.external_identity_map.internal_id'),
  /** @column clnt.external_identity_map.vendor_id — FK to clnt.vendor. Which vendor owns this external ID. */
  vendor_id: z.string().uuid().describe('clnt.external_identity_map.vendor_id'),
  /** @column clnt.external_identity_map.external_id_value — The vendor's external identifier value. */
  external_id_value: z.string().describe('clnt.external_identity_map.external_id_value'),
  /** @column clnt.external_identity_map.effective_date — Effective date of this mapping. */
  effective_date: z.string().date().nullable().describe('clnt.external_identity_map.effective_date'),
  /** @column clnt.external_identity_map.status — Mapping lifecycle state (active, inactive). */
  status: z.string().optional().describe('clnt.external_identity_map.status'),
});
export type ExternalIdentityMapInsertInput = z.infer<typeof ExternalIdentityMapInsert>;

/** Update schema for clnt.external_identity_map (SUPPORT) */
export const ExternalIdentityMapUpdate = z.object({
  /** @column clnt.external_identity_map.effective_date — Effective date of this mapping. */
  effective_date: z.string().date().nullable().optional().describe('clnt.external_identity_map.effective_date'),
  /** @column clnt.external_identity_map.status — Mapping lifecycle state (active, inactive). */
  status: z.string().optional().describe('clnt.external_identity_map.status'),
});
export type ExternalIdentityMapUpdateInput = z.infer<typeof ExternalIdentityMapUpdate>;

/** Insert schema for clnt.invoice (SUPPORT) */
export const InvoiceInsert = z.object({
  /** @column clnt.invoice.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.invoice.client_id'),
  /** @column clnt.invoice.vendor_id — FK to clnt.vendor. Vendor that issued this invoice. */
  vendor_id: z.string().uuid().describe('clnt.invoice.vendor_id'),
  /** @column clnt.invoice.invoice_number — Vendor's invoice reference number. */
  invoice_number: z.string().describe('clnt.invoice.invoice_number'),
  /** @column clnt.invoice.amount — Invoice total amount. */
  amount: z.string().describe('clnt.invoice.amount'),
  /** @column clnt.invoice.invoice_date — Date on the invoice. */
  invoice_date: z.string().date().describe('clnt.invoice.invoice_date'),
  /** @column clnt.invoice.due_date — Payment due date. */
  due_date: z.string().date().nullable().describe('clnt.invoice.due_date'),
  /** @column clnt.invoice.status — Invoice lifecycle. CHECK: received, approved, paid, disputed. */
  status: z.string().optional().describe('clnt.invoice.status'),
});
export type InvoiceInsertInput = z.infer<typeof InvoiceInsert>;

/** Update schema for clnt.invoice (SUPPORT) */
export const InvoiceUpdate = z.object({
  /** @column clnt.invoice.due_date — Payment due date. */
  due_date: z.string().date().nullable().optional().describe('clnt.invoice.due_date'),
  /** @column clnt.invoice.status — Invoice lifecycle. CHECK: received, approved, paid, disputed. */
  status: z.string().optional().describe('clnt.invoice.status'),
});
export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdate>;
