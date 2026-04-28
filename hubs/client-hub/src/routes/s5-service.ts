import { Hono } from 'hono';
import { createCrudRouter } from '../lib/crud';
import type { Env } from '../types';

export const s5Service = new Hono<{ Bindings: Env }>();

s5Service.route(
  '/service_request',
  createCrudRouter({
    name: 'service_request',
    pk: 'service_request_id',
    columns: [
      'service_request_id',
      'client_id',
      'category',
      'status',
      'opened_at',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'category'],
    uuidFields: ['service_request_id', 'client_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s5Service.route(
  '/service_error',
  createCrudRouter({
    name: 'service_error',
    pk: 'service_error_id',
    columns: [
      'service_error_id',
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
    uuidFields: ['service_error_id', 'client_id', 'source_id'],
    autoTimestamps: { createdAt: true },
  })
);
