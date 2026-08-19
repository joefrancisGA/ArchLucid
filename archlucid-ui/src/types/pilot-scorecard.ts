export type PilotScorecardJson = {
  tenantId: string;
  totalRunsCommitted: number;
  totalManifestsCreated: number;
  totalFindingsResolved: number;
  averageTimeToManifestMinutes: number | null;
  totalAuditEventsGenerated: number;
  totalGovernanceApprovalsCompleted: number;
  firstCommitUtc: string | null;
  daysSinceFirstCommit: number | null;
  metricSources?: Record<string, string>;
  baselines: {
    baselineHoursPerReview: number | null;
    baselineReviewsPerQuarter: number | null;
    baselineArchitectHourlyCost: number | null;
    updatedUtc: string;
  } | null;
  roiEstimate: {
    annualReviewCostStatusQuoUsd: number;
    annualReviewSavingsFromReviewTimeLeverUsd: number;
    modelReference: string;
    currency: string;
  } | null;
};
