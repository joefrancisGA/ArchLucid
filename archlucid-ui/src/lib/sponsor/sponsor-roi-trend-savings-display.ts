import { resolveExecutiveTrendSavingsUsd } from "@/lib/execution-mode-honesty";
import type { SponsorRoiHistoryPoint } from "@/lib/sponsor-roi-query-fetch";

import { finiteSponsorRoiHistoryCount } from "@/lib/sponsor/sponsor-roi-trend-history-point-display";

export type SponsorRoiTrendSavingsChartPoint = {
  readonly snapshotUtc: string;
  readonly totalEstimatedUsdSavings: number;
  readonly savingsTooltipSuffix: string | null;
};

/** Avoid buyer-polished $0 savings when run-mix counts were omitted (UU-582). */
export function mapSponsorRoiTrendSavingsChartPoints(
  points: readonly (SponsorRoiHistoryPoint & { snapshotUtc: string })[],
  buyerPolished: boolean,
): SponsorRoiTrendSavingsChartPoint[] {
  return points.map((point) => {
    const real = finiteSponsorRoiHistoryCount(point.realRunCount);
    const simulator = finiteSponsorRoiHistoryCount(point.simulatorRunCount);
    const runMixMissing = real === null || simulator === null;

    const savingsInput = {
      totalEstimatedUsdSavings: Number(point.totalEstimatedUsdSavings) || 0,
      realModeSavingsUsd: Number(point.realModeSavingsUsd) || 0,
      realRunCount: real ?? 0,
      simulatorRunCount: simulator ?? 0,
    };

    const usd =
      buyerPolished && runMixMissing
        ? savingsInput.totalEstimatedUsdSavings
        : resolveExecutiveTrendSavingsUsd(savingsInput, buyerPolished);

    return {
      snapshotUtc: point.snapshotUtc,
      totalEstimatedUsdSavings: usd,
      savingsTooltipSuffix: runMixMissing ? "Run mix not returned" : null,
    };
  });
}
