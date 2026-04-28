import { Hono } from 'hono';
import { createCrudRouter } from '../lib/crud';
import type { Env } from '../types';

export const s3Employee = new Hono<{ Bindings: Env }>();

s3Employee.route(
  '/person',
  createCrudRouter({
    name: 'person',
    pk: 'person_id',
    columns: [
      'person_id',
      'client_id',
      'first_name',
      'last_name',
      'ssn_hash',
      'status',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'first_name', 'last_name'],
    uuidFields: ['person_id', 'client_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s3Employee.route(
  '/employee_error',
  createCrudRouter({
    name: 'employee_error',
    pk: 'employee_error_id',
    columns: [
      'employee_error_id',
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
    uuidFields: ['employee_error_id', 'client_id', 'source_id'],
    autoTimestamps: { createdAt: true },
  })
);

s3Employee.route(
  '/election',
  createCrudRouter({
    name: 'election',
    pk: 'election_id',
    columns: [
      'election_id',
      'client_id',
      'person_id',
      'plan_id',
      'coverage_tier',
      'effective_date',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id', 'person_id', 'plan_id', 'coverage_tier', 'effective_date'],
    uuidFields: ['election_id', 'client_id', 'person_id', 'plan_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s3Employee.route(
  '/enrollment_intake',
  createCrudRouter({
    name: 'enrollment_intake',
    pk: 'enrollment_intake_id',
    columns: [
      'enrollment_intake_id',
      'client_id',
      'upload_date',
      'status',
      'created_at',
      'updated_at',
    ],
    requiredOnCreate: ['client_id'],
    uuidFields: ['enrollment_intake_id', 'client_id'],
    autoTimestamps: { createdAt: true, updatedAt: true },
  })
);

s3Employee.route(
  '/intake_record',
  createCrudRouter({
    name: 'intake_record',
    pk: 'intake_record_id',
    columns: [
      'intake_record_id',
      'client_id',
      'enrollment_intake_id',
      'raw_payload',
      'created_at',
    ],
    jsonColumns: ['raw_payload'],
    requiredOnCreate: ['client_id', 'enrollment_intake_id', 'raw_payload'],
    uuidFields: ['intake_record_id', 'client_id', 'enrollment_intake_id'],
    autoTimestamps: { createdAt: true },
  })
);
