import { hasCommittedReviews } from "@/lib/pilot-scorecard-present";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

export const REVIEW_SCORECARD_SAMPLE_DATA: PilotScorecardJson = {
  tenantId: "00000000-0000-0000-0000-000000000000",
  totalRunsCommitted: 3,
  totalManifestsCreated: 2,
  totalFindingsResolved: 5,
  averageTimeToManifestMinutes: 72,
  totalAuditEventsGenerated: 12,
  totalGovernanceApprovalsCompleted: 2,
  firstCommitUtc: "2026-01-15T00:00:00.000Z",
  daysSinceFirstCommit: 30,
  metricSources: {
    totalRunsCommitted: "illustrative",
    totalManifestsCreated: "illustrative",
    totalFindingsResolved: "illustrative",
    averageTimeToManifestMinutes: "illustrative",
    totalGovernanceApprovalsCompleted: "illustrative",
    totalAuditEventsGenerated: "illustrative",
  },
  baselines: {
    baselineHoursPerReview: 8,
    baselineReviewsPerQuarter: 4,
    baselineArchitectHourlyCost: 175,
    updatedUtc: "2026-02-01T00:00:00.000Z",
  },
  roiEstimate: {
    annualReviewCostStatusQuoUsd: 22400,
    annualReviewSavingsFromReviewTimeLeverUsd: 11200,
    modelReference: "illustrative",
    currency: "USD",
  },
};

export function resolveReviewScorecardDisplayData(
  data: PilotScorecardJson | null,
  sampleMode: boolean,
): PilotScorecardJson | null {
  if (data === null) {
    return null;
  }

  if (sampleMode && !hasCommittedReviews(data)) {
    return REVIEW_SCORECARD_SAMPLE_DATA;
  }

  return data;
}
