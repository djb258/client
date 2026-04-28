import { Hono } from 'hono';
import { createCrudRouter } from '../lib/crud';
import type { Env } from '../types';

export const s1Hub = new Hono<{ Bindings: Env }>();

s1Hub.route(
  '/client',
  createCrudRouter({
    name: 'client',
    pk: 'client_id',
    columns: [
      'client_id',
      'legal_name',
      'fein',
      'domicile_state',
      'effective_date',
      'status',
      'source',
      'version',
      'domain',
      'label_override',
      'logo_url',
      'color_primary',
      'color_accent',
      'feature_flags',
      'dashboard_blocks',
      'created_at',
      'updated_at',
    ],
    jsonColumns: ['feature_flags', 'dashboard_blocks'],
    requiredOnCreate: ['legal_name'],
    uuidFields: ['client_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s1Hub.route(
  '/client_error',
  createCrudRouter({
    name: 'client_error',
    pk: 'client_error_id',
    columns: [
      'client_error_id',
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
    uuidFields: ['client_error_id', 'client_id', 'source_id'],
    autoTimestamps: { createdAt: true },
  })
);
