export type RemediationPrioritizedFinding = {
  findingId: string;
  totalScore: number;
  explanationSummary: string;
  breakdownJson: string;
  cloudResourceId?: string | null;
  controlId?: string | null;
  patternKey?: string | null;
};

export type RemediationFactoryMetrics = {
  openFindings: number;
  riskWeightedOpen: number;
  criticalExposureCount: number;
  createdThisWeek: number;
  remediatedThisWeek: number;
  netBurn: number;
  recurrenceCount: number;
  patternCoverageExactMatchPercent: number;
  automationPercent: number;
  verificationFailureCount: number;
  exceptionsActive: number;
  exceptionsExpiringSoon: number;
  exceptionsExpired: number;
  businessBlockedCount: number;
  averageAgeDays: number;
  topControlIds: ReadonlyArray<{ key: string; count: number }>;
  topPatternKeys: ReadonlyArray<{ key: string; count: number }>;
};

export type RemediationPrioritizationExplanation = {
  findingId: string;
  totalScore: number;
  explanationSummary: string;
  breakdownJson: string;
  ruleVersion: string;
  weights: Record<string, number>;
};
