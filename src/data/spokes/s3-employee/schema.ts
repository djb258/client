// S3-EMPLOYEE: Employee — Enrollment & Employee Identity
// Zod write schemas generated from column registry
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

import { z } from 'zod';

/** Insert schema for clnt.person (CANONICAL) */
export const PersonInsert = z.object({
  /** @column clnt.person.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.person.client_id'),
  /** @column clnt.person.first_name — First name. */
  first_name: z.string().describe('clnt.person.first_name'),
  /** @column clnt.person.last_name — Last name. */
  last_name: z.string().describe('clnt.person.last_name'),
  /** @column clnt.person.ssn_hash — Hashed SSN. Never stores raw SSN. */
  ssn_hash: z.string().nullable().describe('clnt.person.ssn_hash'),
  /** @column clnt.person.status — Person lifecycle state (active, terminated, on_leave). */
  status: z.string().optional().describe('clnt.person.status'),
});
export type PersonInsertInput = z.infer<typeof PersonInsert>;

/** Update schema for clnt.person (CANONICAL) */
export const PersonUpdate = z.object({
  /** @column clnt.person.first_name — First name. */
  first_name: z.string().optional().describe('clnt.person.first_name'),
  /** @column clnt.person.last_name — Last name. */
  last_name: z.string().optional().describe('clnt.person.last_name'),
  /** @column clnt.person.ssn_hash — Hashed SSN. Never stores raw SSN. */
  ssn_hash: z.string().nullable().optional().describe('clnt.person.ssn_hash'),
  /** @column clnt.person.status — Person lifecycle state (active, terminated, on_leave). */
  status: z.string().optional().describe('clnt.person.status'),
});
export type PersonUpdateInput = z.infer<typeof PersonUpdate>;

/** Insert schema for clnt.employee_error (ERROR) */
export const EmployeeErrorInsert = z.object({
  /** @column clnt.employee_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.employee_error.client_id'),
  /** @column clnt.employee_error.source_entity — Table or process that produced the error. */
  source_entity: z.string().describe('clnt.employee_error.source_entity'),
  /** @column clnt.employee_error.source_id — UUID of the entity that caused the error. */
  source_id: z.string().uuid().nullable().describe('clnt.employee_error.source_id'),
  /** @column clnt.employee_error.error_code — Machine-readable error code. */
  error_code: z.string().describe('clnt.employee_error.error_code'),
  /** @column clnt.employee_error.error_message — Human-readable error description. */
  error_message: z.string().describe('clnt.employee_error.error_message'),
  /** @column clnt.employee_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: z.string().optional().describe('clnt.employee_error.severity'),
  /** @column clnt.employee_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: z.string().optional().describe('clnt.employee_error.status'),
  /** @column clnt.employee_error.context — Additional error context and metadata. */
  context: z.record(z.string(), z.unknown()).nullable().describe('clnt.employee_error.context'),
});
export type EmployeeErrorInsertInput = z.infer<typeof EmployeeErrorInsert>;

/** Insert schema for clnt.election (SUPPORT) */
export const ElectionInsert = z.object({
  /** @column clnt.election.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.election.client_id'),
  /** @column clnt.election.person_id — FK to clnt.person. The employee making the election. */
  person_id: z.string().uuid().describe('clnt.election.person_id'),
  /** @column clnt.election.plan_id — FK to clnt.plan. The plan being elected. */
  plan_id: z.string().uuid().describe('clnt.election.plan_id'),
  /** @column clnt.election.coverage_tier — Coverage tier. CHECK: EE, ES, EC, FAM. */
  coverage_tier: z.string().describe('clnt.election.coverage_tier'),
  /** @column clnt.election.effective_date — Election effective date. */
  effective_date: z.string().date().describe('clnt.election.effective_date'),
});
export type ElectionInsertInput = z.infer<typeof ElectionInsert>;

/** Update schema for clnt.election (SUPPORT) */
export const ElectionUpdate = z.object({
  /** @column clnt.election.coverage_tier — Coverage tier. CHECK: EE, ES, EC, FAM. */
  coverage_tier: z.string().optional().describe('clnt.election.coverage_tier'),
  /** @column clnt.election.effective_date — Election effective date. */
  effective_date: z.string().date().optional().describe('clnt.election.effective_date'),
});
export type ElectionUpdateInput = z.infer<typeof ElectionUpdate>;

/** Insert schema for clnt.enrollment_intake (STAGING) */
export const EnrollmentIntakeInsert = z.object({
  /** @column clnt.enrollment_intake.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.enrollment_intake.client_id'),
  /** @column clnt.enrollment_intake.status — Batch processing status (pending, processing, completed, failed). */
  status: z.string().optional().describe('clnt.enrollment_intake.status'),
});
export type EnrollmentIntakeInsertInput = z.infer<typeof EnrollmentIntakeInsert>;

/** Update schema for clnt.enrollment_intake (STAGING) */
export const EnrollmentIntakeUpdate = z.object({
  /** @column clnt.enrollment_intake.status — Batch processing status (pending, processing, completed, failed). */
  status: z.string().optional().describe('clnt.enrollment_intake.status'),
});
export type EnrollmentIntakeUpdateInput = z.infer<typeof EnrollmentIntakeUpdate>;

/** Insert schema for clnt.intake_record (STAGING) */
export const IntakeRecordInsert = z.object({
  /** @column clnt.intake_record.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.intake_record.client_id'),
  /** @column clnt.intake_record.enrollment_intake_id — FK to clnt.enrollment_intake. Parent batch. */
  enrollment_intake_id: z.string().uuid().describe('clnt.intake_record.enrollment_intake_id'),
  /** @column clnt.intake_record.raw_payload — Raw intake data payload. */
  raw_payload: z.record(z.string(), z.unknown()).describe('clnt.intake_record.raw_payload'),
});
export type IntakeRecordInsertInput = z.infer<typeof IntakeRecordInsert>;
