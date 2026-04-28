import { Hono } from 'hono';
import { createCrudRouter } from '../lib/crud';
import type { Env } from '../types';

export const s4Vendor = new Hono<{ Bindings: Env }>();

s4Vendor.route(
  '/vendor',
  createCrudRouter({
    name: 'vendor',
    pk: 'vendor_id',
    columns: [
      'vendor_id',
      'client_id',
      'vendor_name',
      'vendor_type',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'vendor_name'],
    uuidFields: ['vendor_id', 'client_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s4Vendor.route(
  '/vendor_error',
  createCrudRouter({
    name: 'vendor_error',
    pk: 'vendor_error_id',
    columns: [
      'vendor_error_id',
      'client_id',
      'source_entity',
      'source_id',
      'error_code',
      'error_message',
      'severity',
      'status',
      'context',
      'created_at',
    ],
    jsonColumns: ['context'],
    requiredOnCreate: ['client_id', 'source_entity', 'error_code', 'error_message'],
    uuidFields: ['vendor_error_id', 'client_id', 'source_id'],
    autoTimestamps: { createdAt: true },
  })
);

s4Vendor.route(
  '/external_identity_map',
  createCrudRouter({
    name: 'external_identity_map',
    pk: 'external_identity_id',
    columns: [
      'external_identity_id',
      'client_id',
      'entity_type',
      'internal_id',
      'vendor_id',
      'external_id_value',
      'effective_date',
      'status',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'entity_type', 'internal_id', 'vendor_id', 'external_id_value'],
    uuidFields: ['external_identity_id', 'client_id', 'internal_id', 'vendor_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s4Vendor.route(
  '/invoice',
  createCrudRouter({
    name: 'invoice',
    pk: 'invoice_id',
    columns: [
      'invoice_id',
      'client_id',
      'vendor_id',
      'invoice_number',
      'amount',
      'invoice_date',
      'due_date',
      'status',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'vendor_id', 'invoice_number', 'amount', 'invoice_date'],
    uuidFields: ['invoice_id', 'client_id', 'vendor_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);
