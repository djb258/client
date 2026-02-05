/*
 * CTB Metadata
 * ctb_id: CTB-C410955E9739
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/doctrine/MessageGenerationPage.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.819888
 * checksum: 06ca37d0
 */

import { BranchTemplate } from '@/components/template/BranchTemplate';
import { outreachConfig } from '@/lib/template/application-config';

export default function MessageGenerationPage() {
  const branch = outreachConfig.branches.find(b => b.id === '02')!;
  return <BranchTemplate config={outreachConfig} branch={branch} />;
}