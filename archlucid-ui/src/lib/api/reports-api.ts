import { finiteNonNegativeNumberOrDefault, parseNonNegativeFiniteNumber } from '@/lib/parse-finite-number';

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

function sponsorTotal(value: unknown): number {
  return finiteNonNegativeNumberOrDefault(value, 0);
}

function mapSponsorReport(raw: unknown): SponsorReportResult {
  const row = raw !== null && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};

  return {
    totalCostSavingsUsd: sponsorTotal(row.totalCostSavingsUsd),
    totalRiskReductionScore: sponsorTotal(row.totalRiskReductionScore),
    uniqueFindingCount: sponsorTotal(row.uniqueFindingCount),
    rawFindingCount: sponsorTotal(row.rawFindingCount),
    costWasteUsd: parseNonNegativeFiniteNumber(row.costWasteUsd),
    securityRiskCount: sponsorTotal(row.securityRiskCount),
    reliabilityGapCount: sponsorTotal(row.reliabilityGapCount),
    pendingGovernanceDecisionCount: sponsorTotal(row.pendingGovernanceDecisionCount),
  };
}

/** Live rollup from sponsor ROI and approval decisions-needed summary (TB-062). */
export async function getSponsorReport(): Promise<SponsorReportResult> {
  // Negative or non-finite rollups are not forwarded as stored totals.
  return mapSponsorReport(await apiGet<unknown>('/v1/reports/sponsor-report'));
}

