// Hub Accessor — READ-ONLY query surface for clnt schema
//
// This module defines the read-only query contract for the hub.
// Zero mutation functions. All writes happen through spoke schemas.
//
// Implementation Note: Query functions are typed signatures only.
// Actual database bindings are injected by the app layer.

import type { Client, ClientDashboardView } from './types';
import type { Plan, PlanQuote } from '../spokes/s2-plan/types';
import type { Person, Election } from '../spokes/s3-employee/types';
import type { Vendor, ExternalIdentityMap, Invoice } from '../spokes/s4-vendor/types';
import type { ServiceRequest } from '../spokes/s5-service/types';

/**
 * Database client interface. Injected by app layer.
 * The accessor never creates its own connection.
 */
export interface DbClient {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

/**
 * Creates a read-only hub accessor bound to a database client.
 * All functions are SELECT-only. No INSERT, UPDATE, or DELETE.
 */
export function createHubAccessor(db: DbClient) {
  return {
    // ── S1: Hub ──────────────────────────────────────────────────────

    /** Get client by ID */
    async getClient(clientId: string): Promise<Client | null> {
      const rows = await db.query<Client>(
        'SELECT * FROM clnt.client WHERE client_id = $1',
        [clientId]
      );
      return rows[0] ?? null;
    },

    /** List all active clients */
    async listClients(status?: string): Promise<Client[]> {
      if (status) {
        return db.query<Client>(
          'SELECT * FROM clnt.client WHERE status = $1 ORDER BY legal_name',
          [status]
        );
      }
      return db.query<Client>(
        'SELECT * FROM clnt.client ORDER BY legal_name'
      );
    },

    /** Get dashboard view for a client */
    async getDashboard(clientId: string): Promise<ClientDashboardView | null> {
      const rows = await db.query<ClientDashboardView>(
        'SELECT * FROM clnt.v_client_dashboard WHERE client_id = $1',
        [clientId]
      );
      return rows[0] ?? null;
    },

    // ── S2: Plan ─────────────────────────────────────────────────────

    /** List plans for a client */
    async listPlans(clientId: string): Promise<Plan[]> {
      return db.query<Plan>(
        'SELECT * FROM clnt.plan WHERE client_id = $1 ORDER BY benefit_type',
        [clientId]
      );
    },

    /** List quotes for a client */
    async listQuotes(clientId: string): Promise<PlanQuote[]> {
      return db.query<PlanQuote>(
        'SELECT * FROM clnt.plan_quote WHERE client_id = $1 ORDER BY effective_year DESC, benefit_type',
        [clientId]
      );
    },

    // ── S3: Employee ─────────────────────────────────────────────────

    /** List persons for a client */
    async listPersons(clientId: string): Promise<Person[]> {
      return db.query<Person>(
        'SELECT * FROM clnt.person WHERE client_id = $1 ORDER BY last_name, first_name',
        [clientId]
      );
    },

    /** Get person by ID */
    async getPerson(personId: string): Promise<Person | null> {
      const rows = await db.query<Person>(
        'SELECT * FROM clnt.person WHERE person_id = $1',
        [personId]
      );
      return rows[0] ?? null;
    },

    /** List elections for a person */
    async listElections(personId: string): Promise<Election[]> {
      return db.query<Election>(
        'SELECT * FROM clnt.election WHERE person_id = $1 ORDER BY effective_date DESC',
        [personId]
      );
    },

    // ── S4: Vendor ───────────────────────────────────────────────────

    /** List vendors for a client */
    async listVendors(clientId: string): Promise<Vendor[]> {
      return db.query<Vendor>(
        'SELECT * FROM clnt.vendor WHERE client_id = $1 ORDER BY vendor_name',
        [clientId]
      );
    },

    /** List external identity mappings for a vendor */
    async listExternalIds(vendorId: string): Promise<ExternalIdentityMap[]> {
      return db.query<ExternalIdentityMap>(
        'SELECT * FROM clnt.external_identity_map WHERE vendor_id = $1 ORDER BY entity_type',
        [vendorId]
      );
    },

    /** List invoices for a client */
    async listInvoices(clientId: string): Promise<Invoice[]> {
      return db.query<Invoice>(
        'SELECT * FROM clnt.invoice WHERE client_id = $1 ORDER BY invoice_date DESC',
        [clientId]
      );
    },

    // ── S5: Service ──────────────────────────────────────────────────

    /** List service requests for a client */
    async listServiceRequests(clientId: string): Promise<ServiceRequest[]> {
      return db.query<ServiceRequest>(
        'SELECT * FROM clnt.service_request WHERE client_id = $1 ORDER BY opened_at DESC',
        [clientId]
      );
    },
  } as const;
}

/** Type of the hub accessor instance */
export type HubAccessor = ReturnType<typeof createHubAccessor>;
