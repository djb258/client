/*
 * CTB Metadata
 * ctb_id: CTB-BB467C9215C9
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/HEIRPage.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.831745
 * checksum: 365006c0
 */

import { HEIRProvider } from '@/components/heir/HEIRContext';
import HEIRDashboard from '@/components/heir/HEIRDashboard';

export default function HEIRPage() {
  return (
    <HEIRProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <HEIRDashboard />
        </div>
      </div>
    </HEIRProvider>
  );
}