/**
 * Run vendor exports: transform Neon clnt data into vendor-specific
 * output tables using vendor_output_blueprint mappings.
 *
 * Doctrine enforced:
 * - Master file stays clean (clnt schema only).
 * - Exports are vendor-specific tables (e.g. vendor_output_mutualofomaha).
 * - Mapping logic comes from vendor_output_blueprint.mapping_json.
 */

import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const MCP_SERVER_URL = process.env.COMPOSIO_SERVER_URL!;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY!;

// Fetch a blueprint from Neon via MCP
async function getBlueprint(blueprintId: string) {
  const res = await fetch(`${MCP_SERVER_URL}/select`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${COMPOSIO_API_KEY}`
    },
    body: JSON.stringify({
      schema: "clnt",
      table: "vendor_output_blueprint",
      where: { blueprint_id: blueprintId }
    })
  });

  if (!res.ok) throw new Error(`Failed to fetch blueprint: ${await res.text()}`);
  const data = await res.json();
  return data[0]; // first row
}

// Fetch eligible enrollments from Neon via MCP with vendor IDs
async function getEnrollments(vendorId: string, vendorCode: string) {
  const res = await fetch(`${MCP_SERVER_URL}/select`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${COMPOSIO_API_KEY}`
    },
    body: JSON.stringify({
      schema: "clnt",
      table: "employee_benefit_enrollment",
      join: [
        {
          table: "benefit_master",
          on: "employee_benefit_enrollment.benefit_unique_id = benefit_master.benefit_unique_id"
        },
        {
          table: "company_vendor_link",
          on: "benefit_master.company_vendor_id = company_vendor_link.company_vendor_id"
        },
        {
          table: "employee_vendor_ids",
          on: `employee_benefit_enrollment.employee_id = employee_vendor_ids.employee_id AND employee_vendor_ids.vendor_code = '${vendorCode}'`,
          type: "LEFT"
        }
      ],
      where: { "company_vendor_link.vendor_id": vendorId }
    })
  });

  if (!res.ok) throw new Error(`Failed to fetch enrollments: ${await res.text()}`);
  return await res.json();
}

// Insert transformed records into vendor output table
async function insertExport(vendorTable: string, record: any) {
  const res = await fetch(`${MCP_SERVER_URL}/insert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${COMPOSIO_API_KEY}`
    },
    body: JSON.stringify({
      schema: "clnt",
      table: vendorTable,
      values: record
    })
  });

  if (!res.ok) throw new Error(`Insert failed: ${await res.text()}`);
}

// Log audit entry
async function logAudit(companyId: string, action: string, status: string, details: any) {
  const res = await fetch(`${MCP_SERVER_URL}/insert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${COMPOSIO_API_KEY}`
    },
    body: JSON.stringify({
      schema: "shq",
      table: "audit_log",
      values: {
        company_id: companyId,
        agent_id: "VENDOR-EXPORT-AGENT",
        process_type: "vendor_export",
        action: action,
        status: status,
        details: details
      }
    })
  });

  if (!res.ok) console.error(`Audit logging failed: ${await res.text()}`);
}

async function runExport(vendorId: string, blueprintId: string, vendorTable: string, vendorCode: string) {
  const startTime = Date.now();
  console.log(`Starting export for vendor ${vendorId} using blueprint ${blueprintId}...`);

  try {
    const blueprint = await getBlueprint(blueprintId);
    const mapping: Record<string, string> = blueprint.mapping_json;

    const enrollments = await getEnrollments(vendorId, vendorCode);
    let successCount = 0;
    let failureCount = 0;

    for (const row of enrollments) {
      try {
        const record: Record<string, any> = {};

        // Map master fields → vendor fields
        for (const [sourceField, vendorField] of Object.entries(mapping)) {
          record[vendorField] = row[sourceField] ?? null;
        }

        // Include vendor employee ID from employee_vendor_ids table
        if (row.vendor_employee_id) {
          record['vendor_employee_id'] = row.vendor_employee_id;
        }

        await insertExport(vendorTable, record);
        console.log(`Exported enrollment ${row.enrollment_id} → ${vendorTable}`);
        successCount++;
      } catch (err) {
        console.error(`Failed to export enrollment ${row.enrollment_id}:`, err);
        failureCount++;
      }
    }

    const duration = Date.now() - startTime;
    await logAudit(enrollments[0]?.company_id || 'UNKNOWN', 'export_complete', 'success', {
      vendor_id: vendorId,
      blueprint_id: blueprintId,
      vendor_table: vendorTable,
      success_count: successCount,
      failure_count: failureCount,
      total_records: enrollments.length,
      duration_ms: duration
    });

    console.log(`Export completed: ${successCount} success, ${failureCount} failures`);
  } catch (err) {
    const duration = Date.now() - startTime;
    await logAudit('UNKNOWN', 'export_complete', 'failure', {
      vendor_id: vendorId,
      blueprint_id: blueprintId,
      error: err instanceof Error ? err.message : String(err),
      duration_ms: duration
    });
    throw err;
  }
}

async function main() {
  // Example: Mutual of Omaha
  await runExport(
    "MUTUAL_OF_OMAHA_VENDOR_UUID",
    "mutual_of_omaha_blueprint",
    "vendor_output_mutualofomaha",
    "mutual_of_omaha"
  );

  // Example: Guardian Life
  await runExport(
    "GUARDIAN_LIFE_VENDOR_UUID",
    "guardian_life_blueprint",
    "vendor_output_guardianlife",
    "guardian_life"
  );
}

main().catch((err) => {
  console.error("Vendor export failed:", err);
  process.exit(1);
});