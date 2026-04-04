// S3-EMPLOYEE: Employee — Enrollment & Employee Identity
// Schema: clnt | Spoke: s3-employee
// Tables: person, employee_error, election, enrollment_intake, intake_record
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

/**
 * clnt.person — Employee/dependent identity. Promoted from enrollment_intake after validation. Never stores raw SSN.
 * Leaf Type: CANONICAL
 * PK: person_id
 * FK: client.client_id
 */
export interface Person {
  /** @column clnt.person.person_id — Primary key. Auto-generated UUID. */
  person_id: string;

  /** @column clnt.person.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.person.first_name — First name. */
  first_name: string;

  /** @column clnt.person.last_name — Last name. */
  last_name: string;

  /** @column clnt.person.ssn_hash — Hashed SSN. Never stores raw SSN. */
  ssn_hash: string | null;

  /** @column clnt.person.status — Person lifecycle state (active, terminated, on_leave). */
  status: string;

  /** @column clnt.person.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.person.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.employee_error — Employee-level error tracking. Captures enrollment validation failures, promotion errors.
 * Leaf Type: ERROR
 * PK: employee_error_id
 * FK: client.client_id
 */
export interface EmployeeError {
  /** @column clnt.employee_error.employee_error_id — Primary key. Auto-generated UUID. */
  employee_error_id: string;

  /** @column clnt.employee_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.employee_error.source_entity — Table or process that produced the error. */
  source_entity: string;

  /** @column clnt.employee_error.source_id — UUID of the entity that caused the error. */
  source_id: string | null;

  /** @column clnt.employee_error.error_code — Machine-readable error code. */
  error_code: string;

  /** @column clnt.employee_error.error_message — Human-readable error description. */
  error_message: string;

  /** @column clnt.employee_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: string;

  /** @column clnt.employee_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: string;

  /** @column clnt.employee_error.context — Additional error context and metadata. */
  context: Record<string, unknown> | null;

  /** @column clnt.employee_error.created_at — Record creation timestamp. Append-only. */
  created_at: string;

}

/**
 * clnt.election — Benefit election bridge. Links person to plan with coverage tier.
 * Leaf Type: SUPPORT
 * PK: election_id
 * FK: client.client_id, person.person_id, plan.plan_id
 */
export interface Election {
  /** @column clnt.election.election_id — Primary key. Auto-generated UUID. */
  election_id: string;

  /** @column clnt.election.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.election.person_id — FK to clnt.person. The employee making the election. */
  person_id: string;

  /** @column clnt.election.plan_id — FK to clnt.plan. The plan being elected. */
  plan_id: string;

  /** @column clnt.election.coverage_tier — Coverage tier. CHECK: EE, ES, EC, FAM. */
  coverage_tier: string;

  /** @column clnt.election.effective_date — Election effective date. */
  effective_date: string;

  /** @column clnt.election.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.election.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.enrollment_intake — Batch enrollment upload header. Staging only. Data promotes to person after validation.
 * Leaf Type: STAGING
 * PK: enrollment_intake_id
 * FK: client.client_id
 */
export interface EnrollmentIntake {
  /** @column clnt.enrollment_intake.enrollment_intake_id — Primary key. Auto-generated UUID. */
  enrollment_intake_id: string;

  /** @column clnt.enrollment_intake.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.enrollment_intake.upload_date — Upload timestamp. Auto-set. */
  upload_date: string;

  /** @column clnt.enrollment_intake.status — Batch processing status (pending, processing, completed, failed). */
  status: string;

  /** @column clnt.enrollment_intake.created_at — Record creation timestamp. */
  created_at: string;

  /** @column clnt.enrollment_intake.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.intake_record — Individual raw intake records. Immutable after insert. Linked to enrollment_intake batch.
 * Leaf Type: STAGING
 * PK: intake_record_id
 * FK: client.client_id, enrollment_intake.enrollment_intake_id
 */
export interface IntakeRecord {
  /** @column clnt.intake_record.intake_record_id — Primary key. Auto-generated UUID. */
  intake_record_id: string;

  /** @column clnt.intake_record.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.intake_record.enrollment_intake_id — FK to clnt.enrollment_intake. Parent batch. */
  enrollment_intake_id: string;

  /** @column clnt.intake_record.raw_payload — Raw intake data payload. */
  raw_payload: Record<string, unknown>;

  /** @column clnt.intake_record.created_at — Record creation timestamp. Immutable. */
  created_at: string;

}
