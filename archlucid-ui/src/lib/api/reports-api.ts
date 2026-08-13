import { apiGet } from './http';

export type SponsorReportResult = {
  totalCostSavingsUsd: number;
  /** Resolved findings in trailing 30d (deduped), not pending governance load. */
  totalRiskReductionScore: number;
  uniqueFindingCount: number;
  rawFindingCount: number;
  /** Omitted until a distinct waste metric exists (TB-152). */
  costWasteUsd: number | null;
  securityRiskCount: number;
  reliabilityGapCount: number;
  pendingGovernanceDecisionCount: number;
};

/** Live rollup from sponsor ROI and governance decisions-needed summary (TB-062). */
export async function getSponsorReport(): Promise<SponsorReportResult> {
  return apiGet<SponsorReportResult>('/v1/reports/sponsor-report');
}

