// Hub types — re-exports all spoke types + hub-level view types
// This file provides a single import point for consumers.

// Re-export all spoke types
export type {
  Client,
  ClientError,
} from '../spokes/s1-hub/types';

export type {
  Plan,
  PlanError,
  PlanQuote,
} from '../spokes/s2-plan/types';

export type {
  Person,
  EmployeeError,
  Election,
  EnrollmentIntake,
  IntakeRecord,
} from '../spokes/s3-employee/types';

export type {
  Vendor,
  VendorError,
  ExternalIdentityMap,
  Invoice,
} from '../spokes/s4-vendor/types';

export type {
  ServiceRequest,
  ServiceError,
} from '../spokes/s5-service/types';

/**
 * v_client_dashboard — Read-only view joining client + projection data.
 * Used by lovable.dev for dashboard rendering.
 * This type represents the denormalized view surface.
 */
export interface ClientDashboardView {
  /** @column clnt.v_client_dashboard.client_id */
  client_id: string;

  /** @column clnt.v_client_dashboard.legal_name */
  legal_name: string;

  /** @column clnt.v_client_dashboard.status */
  status: string;

  /** @column clnt.v_client_dashboard.effective_date */
  effective_date: string | null;

  /** @column clnt.v_client_dashboard.domain */
  domain: string | null;

  /** @column clnt.v_client_dashboard.label_override */
  label_override: string | null;

  /** @column clnt.v_client_dashboard.logo_url */
  logo_url: string | null;

  /** @column clnt.v_client_dashboard.color_primary */
  color_primary: string | null;

  /** @column clnt.v_client_dashboard.color_accent */
  color_accent: string | null;

  /** @column clnt.v_client_dashboard.feature_flags */
  feature_flags: Record<string, unknown>;

  /** @column clnt.v_client_dashboard.dashboard_blocks */
  dashboard_blocks: unknown[];
}
