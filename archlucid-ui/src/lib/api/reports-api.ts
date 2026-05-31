import { apiGet } from './http';

export type ExecutiveSummaryResult = {
  totalCostSavingsUsd: number;
  totalRiskReductionScore: number;
  uniqueFindingCount: number;
  rawFindingCount: number;
  costWasteUsd: number;
  securityRiskCount: number;
  reliabilityGapCount: number;
};

/** Live rollup from executive ROI and governance decisions-needed summary (TB-062). */
export async function getExecutiveSummary(): Promise<ExecutiveSummaryResult> {
  return apiGet<ExecutiveSummaryResult>('/v1/reports/executive-summary');
}

