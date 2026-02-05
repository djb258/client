/*
 * CTB Metadata
 * ctb_id: CTB-5F6FA7E07228
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/doctrine/LeadIntakePage.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.813626
 * checksum: 277f40f9
 */

import { BranchTemplate } from '@/components/template/BranchTemplate';
import { outreachConfig } from '@/lib/template/application-config';

export default function LeadIntakePage() {
  const branch = outreachConfig.branches.find(b => b.id === '01')!;
  return <BranchTemplate config={outreachConfig} branch={branch} />;
}