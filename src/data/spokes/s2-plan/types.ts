// S2-PLAN: Plan — Benefits & Quote Intake
// Schema: clnt | Spoke: s2-plan
// Tables: plan, plan_error, plan_quote
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

/**
 * clnt.plan — Canonical benefit plan with embedded fixed cost tiers.
 * Leaf Type: CANONICAL
 * PK: plan_id
 * FK: client.client_id
 */
export interface Plan {
  /** @column clnt.plan.plan_id — Primary key. Auto-generated UUID. */
  plan_id: string;

  /** @column clnt.plan.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.plan.benefit_type — Benefit category: medical, dental, vision, life, etc. */
  benefit_type: string;

  /** @column clnt.plan.carrier_id — Carrier identifier for this plan. */
  carrier_id: string | null;

  /** @column clnt.plan.effective_date — Plan effective date for coverage period. */
  effective_date: string | null;

  /** @column clnt.plan.status — Plan lifecycle state (active, terminated, pending). */
  status: string;

  /** @column clnt.plan.version — Record version counter for optimistic concurrency. */
  version: number;

  /** @column clnt.plan.rate_ee — Employee-only rate tier. */
  rate_ee: string | null;

  /** @column clnt.plan.rate_es — Employee + Spouse rate tier. */
  rate_es: string | null;

  /** @column clnt.plan.rate_ec — Employee + Children rate tier. */
  rate_ec: string | null;

  /** @column clnt.plan.rate_fam — Family rate tier. */
  rate_fam: string | null;

  /** @column clnt.plan.employer_rate_ee — Employer contribution for Employee tier. */
  employer_rate_ee: string | null;

  /** @column clnt.plan.employer_rate_es — Employer contribution for Employee + Spouse tier. */
  employer_rate_es: string | null;

  /** @column clnt.plan.employer_rate_ec — Employer contribution for Employee + Children tier. */
  employer_rate_ec: string | null;

  /** @column clnt.plan.employer_rate_fam — Employer contribution for Family tier. */
  employer_rate_fam: string | null;

  /** @column clnt.plan.source_quote_id — FK to plan_quote. Tracks promotion lineage. NULL for manual/migration plans. */
  source_quote_id: string | null;

  /** @column clnt.plan.created_at — Record creation timestamp. Auto-set, never modified. */
  created_at: string;

  /** @column clnt.plan.updated_at — Last modification timestamp. Auto-updated via trigger. */
  updated_at: string;

}

/**
 * clnt.plan_error — Plan-level error tracking. Captures failures in plan imports, rate validation, quote promotion.
 * Leaf Type: ERROR
 * PK: plan_error_id
 * FK: client.client_id
 */
export interface PlanError {
  /** @column clnt.plan_error.plan_error_id — Primary key. Auto-generated UUID. */
  plan_error_id: string;

  /** @column clnt.plan_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.plan_error.source_entity — Table or process that produced the error. */
  source_entity: string;

  /** @column clnt.plan_error.source_id — UUID of the entity that caused the error. */
  source_id: string | null;

  /** @column clnt.plan_error.error_code — Machine-readable error code. */
  error_code: string;

  /** @column clnt.plan_error.error_message — Human-readable error description. */
  error_message: string;

  /** @column clnt.plan_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: string;

  /** @column clnt.plan_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: string;

  /** @column clnt.plan_error.context — Additional error context and metadata. */
  context: Record<string, unknown> | null;

  /** @column clnt.plan_error.created_at — Record creation timestamp. Append-only. */
  created_at: string;

}

/**
 * clnt.plan_quote — Received carrier quotes. Multiple per benefit type/year allowed.
 * Leaf Type: SUPPORT
 * PK: plan_quote_id
 * FK: client.client_id
 */
export interface PlanQuote {
  /** @column clnt.plan_quote.plan_quote_id — Primary key. Auto-generated UUID. */
  plan_quote_id: string;

  /** @column clnt.plan_quote.client_id — FK to clnt.client. Sovereign join key. */
  client_id: string;

  /** @column clnt.plan_quote.benefit_type — Benefit category this quote covers. */
  benefit_type: string;

  /** @column clnt.plan_quote.carrier_id — Carrier identifier submitting the quote. */
  carrier_id: string;

  /** @column clnt.plan_quote.effective_year — Plan year this quote applies to. */
  effective_year: number;

  /** @column clnt.plan_quote.rate_ee — Quoted Employee-only rate. */
  rate_ee: string | null;

  /** @column clnt.plan_quote.rate_es — Quoted Employee + Spouse rate. */
  rate_es: string | null;

  /** @column clnt.plan_quote.rate_ec — Quoted Employee + Children rate. */
  rate_ec: string | null;

  /** @column clnt.plan_quote.rate_fam — Quoted Family rate. */
  rate_fam: string | null;

  /** @column clnt.plan_quote.source — Origin of quote (broker, carrier portal, RFP). */
  source: string | null;

  /** @column clnt.plan_quote.received_date — Date the quote was received. */
  received_date: string | null;

  /** @column clnt.plan_quote.status — Quote lifecycle. CHECK: received, presented, selected, rejected. */
  status: string;

  /** @column clnt.plan_quote.created_at — Record creation timestamp. Append-mostly. */
  created_at: string;

}
