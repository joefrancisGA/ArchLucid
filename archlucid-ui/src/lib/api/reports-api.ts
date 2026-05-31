import { apiGet } from './http';

export type ExecutiveSummaryResult = {
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

/** Live rollup from executive ROI and governance decisions-needed summary (TB-062). */
export async function getExecutiveSummary(): Promise<ExecutiveSummaryResult> {
  return apiGet<ExecutiveSummaryResult>('/v1/reports/executive-summary');
}

