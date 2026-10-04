import { resolveExecutiveTrendSavingsUsd } from "@/lib/execution-mode-honesty";
import type { SponsorRoiHistoryPoint } from "@/lib/sponsor-roi-query-fetch";

import { finiteSponsorRoiHistoryCount } from "@/lib/sponsor/sponsor-roi-trend-history-point-display";

export type SponsorRoiTrendSavingsChartPoint = {
  readonly snapshotUtc: string;
  readonly totalEstimatedUsdSavings: number | null;
  readonly savingsTooltipSuffix: string | null;
};

function finiteSponsorRoiSavingsUsd(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

/** Avoid buyer-polished $0 savings when run-mix counts were omitted (UU-582). */
export function mapSponsorRoiTrendSavingsChartPoints(
  points: readonly (SponsorRoiHistoryPoint & { snapshotUtc: string })[],
  buyerPolished: boolean,
): SponsorRoiTrendSavingsChartPoint[] {
  return points.map((point) => {
    const real = finiteSponsorRoiHistoryCount(point.realRunCount);
    const simulator = finiteSponsorRoiHistoryCount(point.simulatorRunCount);
    const runMixMissing = real === null || simulator === null;

    const totalEstimatedUsdSavings = finiteSponsorRoiSavingsUsd(point.totalEstimatedUsdSavings);
    const realModeSavingsUsd = finiteSponsorRoiSavingsUsd(point.realModeSavingsUsd);

    if (runMixMissing) {
      return {
        snapshotUtc: point.snapshotUtc,
        totalEstimatedUsdSavings,
        savingsTooltipSuffix: "Run mix not returned",
      };
    }

    if (totalEstimatedUsdSavings === null) {
      return {
        snapshotUtc: point.snapshotUtc,
        totalEstimatedUsdSavings: null,
        savingsTooltipSuffix: "Amount not returned",
      };
    }

    const usd = resolveExecutiveTrendSavingsUsd(
      {
        totalEstimatedUsdSavings,
        realModeSavingsUsd: realModeSavingsUsd ?? 0,
        realRunCount: real!,
        simulatorRunCount: simulator!,
      },
      buyerPolished,
    );

    return {
      snapshotUtc: point.snapshotUtc,
      totalEstimatedUsdSavings: usd,
      savingsTooltipSuffix: null,
    };
  });
}
