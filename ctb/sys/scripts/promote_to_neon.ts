/*
 * CTB Metadata
 * ctb_id: CTB-5F0F0688C295
 * ctb_branch: sys
 * ctb_path: sys/scripts/promote_to_neon.ts
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:00.841208
 * checksum: 5b97e63a
 */

/**
 * Promote validated intake records from Firebase (clnt_subhive)
 * into Neon (clnt schema) via Composio MCP server.
 *
 * Doctrine enforced: STAMPED/SPVPET alignment, no direct Neon writes.
 */

import fetch from "node-fetch";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

// Firebase init
initializeApp();
const db = getFirestore();

// Composio MCP endpoint
const MCP_SERVER_URL = process.env.COMPOSIO_SERVER_URL!;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY!;

async function promoteCollection(
  collection: string,
  targetTable: string,
  fieldMap: Record<string, string>
) {
  const snapshot = await db.collection(`clnt_subhive/${collection}`).where("validated", "==", true).get();

  if (snapshot.empty) {
    console.log(`No validated records found in ${collection}`);
    return;
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Map Firebase fields → Neon fields
    const payload: Record<string, any> = {};
    for (const [src, dest] of Object.entries(fieldMap)) {
      payload[dest] = data[src];
    }

    // Call MCP server to insert into Neon
    const res = await fetch(`${MCP_SERVER_URL}/insert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COMPOSIO_API_KEY}`
      },
      body: JSON.stringify({
        schema: "clnt",
        table: targetTable,
        values: payload
      })
    });

    if (!res.ok) {
      console.error(`Failed to promote ${collection}/${doc.id}`, await res.text());
      continue;
    }

    console.log(`Promoted ${collection}/${doc.id} → ${targetTable}`);
    await doc.ref.update({ promoted_to: targetTable, timestamp_last_touched: new Date() });
  }
}

async function main() {
  // Company intake → company_master
  await promoteCollection("company_intake", "company_master", {
    company_name: "company_name",
    ein: "ein",
    address: "address"
  });

  // Employee intake → employee_master
  await promoteCollection("employee_intake", "employee_master", {
    company_unique_id: "company_unique_id",
    first_name: "first_name",
    last_name: "last_name",
    dob: "dob",
    ssn_last4: "ssn_last4"
  });

  // Benefit intake → benefit_master
  await promoteCollection("benefit_intake", "benefit_master", {
    company_vendor_id: "company_vendor_id",
    vendor_benefit_id: "vendor_benefit_id",
    benefit_type: "benefit_type",
    effective_date: "effective_date",
    renewal_date: "renewal_date"
  });
}

main().catch((err) => {
  console.error("Promotion job failed:", err);
  process.exit(1);
});