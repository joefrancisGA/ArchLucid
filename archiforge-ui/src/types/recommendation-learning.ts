export type OutcomeStats = {
  key: string;
  proposedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  deferredCount: number;
  implementedCount: number;
  acceptanceRate: number;
  rejectionRate: number;
  deferredRate: number;
  implementationRate: number;
};

export type LearningProfile = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
  generatedUtc: string;
  categoryStats: OutcomeStats[];
  urgencyStats: OutcomeStats[];
  signalTypeStats: OutcomeStats[];
  categoryWeights: Record<string, number>;
  urgencyWeights: Record<string, number>;
  signalTypeWeights: Record<string, number>;
  notes: string[];
};
