/*
 * CTB Metadata
 * ctb_id: CTB-BBE9C746AB7C
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/DoctrineMapPage.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.826104
 * checksum: 3799f880
 */

import { ProcessFlowDiagram } from '@/components/template/ProcessFlowDiagram';
import { outreachConfig } from '@/lib/template/application-config';

export default function DoctrineMapPage() {
  return <ProcessFlowDiagram config={outreachConfig} />;
}