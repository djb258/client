import { Hono } from 'hono';
import { createCrudRouter } from '../lib/crud';
import type { Env } from '../types';

export const s2Plan = new Hono<{ Bindings: Env }>();

s2Plan.route(
  '/plan',
  createCrudRouter({
    name: 'plan',
    pk: 'plan_id',
    columns: [
      'plan_id',
      'client_id',
      'benefit_type',
      'carrier_id',
      'effective_date',
      'status',
      'version',
      'rate_ee',
      'rate_es',
      'rate_ec',
      'rate_fam',
      'employer_rate_ee',
      'employer_rate_es',
      'employer_rate_ec',
      'employer_rate_fam',
      'source_quote_id',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'benefit_type', 'status', 'version'],
    uuidFields: ['plan_id', 'client_id', 'source_quote_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s2Plan.route(
  '/plan_error',
  createCrudRouter({
    name: 'plan_error',
    pk: 'plan_error_id',
    columns: [
      'plan_error_id',
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
    uuidFields: ['plan_error_id', 'client_id', 'source_id'],
    autoTimestamps: { createdAt: true },
  })
);

s2Plan.route(
  '/plan_quote',
  createCrudRouter({
    name: 'plan_quote',
    pk: 'plan_quote_id',
    columns: [
      'plan_quote_id',
      'client_id',
      'benefit_type',
      'carrier_id',
      'effective_year',
      'rate_ee',
      'rate_es',
      'rate_ec',
      'rate_fam',
      'source',
      'received_date',
      'status',
      'created_at',
    ],
    requiredOnCreate: ['client_id', 'benefit_type', 'carrier_id', 'effective_year'],
    uuidFields: ['plan_quote_id', 'client_id'],
    autoTimestamps: { createdAt: true },
  })
);
