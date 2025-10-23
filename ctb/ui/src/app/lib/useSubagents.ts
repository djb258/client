/*
 * CTB Metadata
 * ctb_id: CTB-6B7FE4F5DF4F
 * ctb_branch: ui
 * ctb_path: ui/src/app/lib/useSubagents.ts
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.886548
 * checksum: 9986e3ce
 */

export async function fetchSubagents() {
  const res = await fetch("/api/subagents", { cache: "no-store" });
  if (!res.ok) return { items: [] as Array<{id:string;bay:string;desc:string}> };
  return res.json();
}