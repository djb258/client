/*
 * CTB Metadata
 * ctb_id: CTB-3D4F3002F5C2
 * ctb_branch: ui
 * ctb_path: ui/pages/barton-pages/Index.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.850490
 * checksum: 711d47c5
 */

import { BartonTemplate } from '@/components/template/BartonTemplate';
import { outreachConfig } from '@/lib/template/application-config';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  console.log('Index component rendering...', outreachConfig);
  const navigate = useNavigate();
  
  return (
    <div>
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={() => navigate('/imo-creator')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          IMO Creator
        </Button>
      </div>
      <BartonTemplate config={outreachConfig} />
    </div>
  );
};

export default Index;
