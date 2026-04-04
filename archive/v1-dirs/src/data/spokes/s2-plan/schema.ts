// S2-PLAN: Plan — Benefits & Quote Intake
// Zod write schemas generated from column registry
// GENERATED FROM: src/data/db/registry/clnt_column_registry.yml
// DO NOT HAND-EDIT. Run: npx ts-node scripts/codegen-schema.ts

import { z } from 'zod';

/** Insert schema for clnt.plan (CANONICAL) */
export const PlanInsert = z.object({
  /** @column clnt.plan.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.plan.client_id'),
  /** @column clnt.plan.benefit_type — Benefit category: medical, dental, vision, life, etc. */
  benefit_type: z.string().describe('clnt.plan.benefit_type'),
  /** @column clnt.plan.carrier_id — Carrier identifier for this plan. */
  carrier_id: z.string().nullable().describe('clnt.plan.carrier_id'),
  /** @column clnt.plan.effective_date — Plan effective date for coverage period. */
  effective_date: z.string().date().nullable().describe('clnt.plan.effective_date'),
  /** @column clnt.plan.status — Plan lifecycle state (active, terminated, pending). */
  status: z.string().optional().describe('clnt.plan.status'),
  /** @column clnt.plan.version — Record version counter for optimistic concurrency. */
  version: z.number().int().optional().describe('clnt.plan.version'),
  /** @column clnt.plan.rate_ee — Employee-only rate tier. */
  rate_ee: z.string().nullable().describe('clnt.plan.rate_ee'),
  /** @column clnt.plan.rate_es — Employee + Spouse rate tier. */
  rate_es: z.string().nullable().describe('clnt.plan.rate_es'),
  /** @column clnt.plan.rate_ec — Employee + Children rate tier. */
  rate_ec: z.string().nullable().describe('clnt.plan.rate_ec'),
  /** @column clnt.plan.rate_fam — Family rate tier. */
  rate_fam: z.string().nullable().describe('clnt.plan.rate_fam'),
  /** @column clnt.plan.employer_rate_ee — Employer contribution for Employee tier. */
  employer_rate_ee: z.string().nullable().describe('clnt.plan.employer_rate_ee'),
  /** @column clnt.plan.employer_rate_es — Employer contribution for Employee + Spouse tier. */
  employer_rate_es: z.string().nullable().describe('clnt.plan.employer_rate_es'),
  /** @column clnt.plan.employer_rate_ec — Employer contribution for Employee + Children tier. */
  employer_rate_ec: z.string().nullable().describe('clnt.plan.employer_rate_ec'),
  /** @column clnt.plan.employer_rate_fam — Employer contribution for Family tier. */
  employer_rate_fam: z.string().nullable().describe('clnt.plan.employer_rate_fam'),
  /** @column clnt.plan.source_quote_id — FK to plan_quote. Tracks promotion lineage. NULL for manual/migration plans. */
  source_quote_id: z.string().uuid().nullable().describe('clnt.plan.source_quote_id'),
});
export type PlanInsertInput = z.infer<typeof PlanInsert>;

/** Update schema for clnt.plan (CANONICAL) */
export const PlanUpdate = z.object({
  /** @column clnt.plan.benefit_type — Benefit category: medical, dental, vision, life, etc. */
  benefit_type: z.string().optional().describe('clnt.plan.benefit_type'),
  /** @column clnt.plan.carrier_id — Carrier identifier for this plan. */
  carrier_id: z.string().nullable().optional().describe('clnt.plan.carrier_id'),
  /** @column clnt.plan.effective_date — Plan effective date for coverage period. */
  effective_date: z.string().date().nullable().optional().describe('clnt.plan.effective_date'),
  /** @column clnt.plan.status — Plan lifecycle state (active, terminated, pending). */
  status: z.string().optional().describe('clnt.plan.status'),
  /** @column clnt.plan.version — Record version counter for optimistic concurrency. */
  version: z.number().int().optional().describe('clnt.plan.version'),
  /** @column clnt.plan.rate_ee — Employee-only rate tier. */
  rate_ee: z.string().nullable().optional().describe('clnt.plan.rate_ee'),
  /** @column clnt.plan.rate_es — Employee + Spouse rate tier. */
  rate_es: z.string().nullable().optional().describe('clnt.plan.rate_es'),
  /** @column clnt.plan.rate_ec — Employee + Children rate tier. */
  rate_ec: z.string().nullable().optional().describe('clnt.plan.rate_ec'),
  /** @column clnt.plan.rate_fam — Family rate tier. */
  rate_fam: z.string().nullable().optional().describe('clnt.plan.rate_fam'),
  /** @column clnt.plan.employer_rate_ee — Employer contribution for Employee tier. */
  employer_rate_ee: z.string().nullable().optional().describe('clnt.plan.employer_rate_ee'),
  /** @column clnt.plan.employer_rate_es — Employer contribution for Employee + Spouse tier. */
  employer_rate_es: z.string().nullable().optional().describe('clnt.plan.employer_rate_es'),
  /** @column clnt.plan.employer_rate_ec — Employer contribution for Employee + Children tier. */
  employer_rate_ec: z.string().nullable().optional().describe('clnt.plan.employer_rate_ec'),
  /** @column clnt.plan.employer_rate_fam — Employer contribution for Family tier. */
  employer_rate_fam: z.string().nullable().optional().describe('clnt.plan.employer_rate_fam'),
  /** @column clnt.plan.source_quote_id — FK to plan_quote. Tracks promotion lineage. NULL for manual/migration plans. */
  source_quote_id: z.string().uuid().nullable().optional().describe('clnt.plan.source_quote_id'),
});
export type PlanUpdateInput = z.infer<typeof PlanUpdate>;

/** Insert schema for clnt.plan_error (ERROR) */
export const PlanErrorInsert = z.object({
  /** @column clnt.plan_error.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.plan_error.client_id'),
  /** @column clnt.plan_error.source_entity — Table or process that produced the error. */
  source_entity: z.string().describe('clnt.plan_error.source_entity'),
  /** @column clnt.plan_error.source_id — UUID of the entity that caused the error. */
  source_id: z.string().uuid().nullable().describe('clnt.plan_error.source_id'),
  /** @column clnt.plan_error.error_code — Machine-readable error code. */
  error_code: z.string().describe('clnt.plan_error.error_code'),
  /** @column clnt.plan_error.error_message — Human-readable error description. */
  error_message: z.string().describe('clnt.plan_error.error_message'),
  /** @column clnt.plan_error.severity — Error severity. CHECK: warning, error, critical. */
  severity: z.string().optional().describe('clnt.plan_error.severity'),
  /** @column clnt.plan_error.status — Error lifecycle. CHECK: open, resolved, dismissed. */
  status: z.string().optional().describe('clnt.plan_error.status'),
  /** @column clnt.plan_error.context — Additional error context and metadata. */
  context: z.record(z.string(), z.unknown()).nullable().describe('clnt.plan_error.context'),
});
export type PlanErrorInsertInput = z.infer<typeof PlanErrorInsert>;

/** Insert schema for clnt.plan_quote (SUPPORT) */
export const PlanQuoteInsert = z.object({
  /** @column clnt.plan_quote.client_id — FK to clnt.client. Sovereign join key. */
  client_id: z.string().uuid().describe('clnt.plan_quote.client_id'),
  /** @column clnt.plan_quote.benefit_type — Benefit category this quote covers. */
  benefit_type: z.string().describe('clnt.plan_quote.benefit_type'),
  /** @column clnt.plan_quote.carrier_id — Carrier identifier submitting the quote. */
  carrier_id: z.string().describe('clnt.plan_quote.carrier_id'),
  /** @column clnt.plan_quote.effective_year — Plan year this quote applies to. */
  effective_year: z.number().int().describe('clnt.plan_quote.effective_year'),
  /** @column clnt.plan_quote.rate_ee — Quoted Employee-only rate. */
  rate_ee: z.string().nullable().describe('clnt.plan_quote.rate_ee'),
  /** @column clnt.plan_quote.rate_es — Quoted Employee + Spouse rate. */
  rate_es: z.string().nullable().describe('clnt.plan_quote.rate_es'),
  /** @column clnt.plan_quote.rate_ec — Quoted Employee + Children rate. */
  rate_ec: z.string().nullable().describe('clnt.plan_quote.rate_ec'),
  /** @column clnt.plan_quote.rate_fam — Quoted Family rate. */
  rate_fam: z.string().nullable().describe('clnt.plan_quote.rate_fam'),
  /** @column clnt.plan_quote.source — Origin of quote (broker, carrier portal, RFP). */
  source: z.string().nullable().describe('clnt.plan_quote.source'),
  /** @column clnt.plan_quote.received_date — Date the quote was received. */
  received_date: z.string().date().nullable().describe('clnt.plan_quote.received_date'),
  /** @column clnt.plan_quote.status — Quote lifecycle. CHECK: received, presented, selected, rejected. */
  status: z.string().optional().describe('clnt.plan_quote.status'),
});
export type PlanQuoteInsertInput = z.infer<typeof PlanQuoteInsert>;

/** Update schema for clnt.plan_quote (SUPPORT) */
export const PlanQuoteUpdate = z.object({
  /** @column clnt.plan_quote.status — Quote lifecycle. CHECK: received, presented, selected, rejected. */
  status: z.string().optional().describe('clnt.plan_quote.status'),
});
export type PlanQuoteUpdateInput = z.infer<typeof PlanQuoteUpdate>;
