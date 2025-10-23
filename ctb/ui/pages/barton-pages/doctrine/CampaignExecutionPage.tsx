/*
 * CTB Metadata
 * ctb_id: CTB-FADAB6B3D201
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/doctrine/CampaignExecutionPage.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.802593
 * checksum: 77b8b3f4
 */

import { BranchTemplate } from '@/components/template/BranchTemplate';
import { outreachConfig } from '@/lib/template/application-config';

export default function CampaignExecutionPage() {
  const branch = outreachConfig.branches.find(b => b.id === '03')!;
  return <BranchTemplate config={outreachConfig} branch={branch} />;
}