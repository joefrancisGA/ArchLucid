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

/** Mock-backed until reports persistence lands — production executive routes must use `/v1/roi/executive-summary` instead. */
export async function getExecutiveSummary(): Promise<ExecutiveSummaryResult> {
  return apiGet<ExecutiveSummaryResult>('/v1/reports/executive-summary');
}

