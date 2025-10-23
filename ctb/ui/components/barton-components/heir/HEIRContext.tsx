/*
 * CTB Metadata
 * ctb_id: CTB-BEB11DB3E4F9
 * ctb_branch: ui
 * ctb_path: ui/components/barton-components/heir/HEIRContext.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.410660
 * checksum: 2cf1f46f
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useHEIR } from '@/hooks/useHEIR';
import { Agent, Task, HEIRContext as HEIRContextType, TaskPriority, AgentCommunication } from '@/lib/heir/types';

interface HEIRContextValue {
  context: HEIRContextType;
  agents: Agent[];
  tasks: Task[];
  systemStatus: HEIRContextType['systemStatus'];
  communications: AgentCommunication[];
  createTask: (title: string, description: string, priority?: TaskPriority) => Promise<Task>;
  completeTask: (taskId: string, agentId: string) => Promise<void>;
  getSystemStatus: () => {
    activeTasks: Task[];
    queuedTasks: Task[];
    activeAgents: Agent[];
    communicationLog: AgentCommunication[];
  };
  getCommunicationHistory: () => AgentCommunication[];
  getAgentStatus: (agentId: string) => Agent | undefined;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  initializeSystem: () => void;
}

const HEIRContext = createContext<HEIRContextValue | undefined>(undefined);

export function HEIRProvider({ children }: { children: ReactNode }) {
  const heirSystem = useHEIR();

  return (
    <HEIRContext.Provider value={heirSystem}>
      {children}
    </HEIRContext.Provider>
  );
}

export function useHEIRContext() {
  const context = useContext(HEIRContext);
  if (!context) {
    throw new Error('useHEIRContext must be used within a HEIRProvider');
  }
  return context;
}