import { describe, expect, it } from "vitest";

import {
  AMOUNT_NOT_RETURNED,
  RUN_MIX_NOT_RETURNED,
} from "@/lib/amount-display-copy";
import { mapSponsorRoiTrendSavingsChartPoints } from "@/lib/sponsor/sponsor-roi-trend-savings-display";

describe("mapSponsorRoiTrendSavingsChartPoints", () => {
  it("does not zero buyer-polished savings when run-mix counts are missing", () => {
    const points = mapSponsorRoiTrendSavingsChartPoints(
      [
        {
          snapshotUtc: "2026-05-15T00:00:00Z",
          totalEstimatedUsdSavings: 500,
          realModeSavingsUsd: 0,
          realRunCount: undefined,
          simulatorRunCount: 4,
        },
      ],
      true,
    );

    expect(points[0]?.totalEstimatedUsdSavings).toBe(500);
    expect(points[0]?.savingsTooltipSuffix).toBe(RUN_MIX_NOT_RETURNED);
  });

  it("does not coerce omitted real-mode savings to zero in buyer-polished mode", () => {
    const points = mapSponsorRoiTrendSavingsChartPoints(
      [
        {
          snapshotUtc: "2026-05-15T00:00:00Z",
          totalEstimatedUsdSavings: 500,
          realModeSavingsUsd: undefined,
          realRunCount: 2,
          simulatorRunCount: 0,
        },
      ],
      true,
    );

    expect(points[0]?.totalEstimatedUsdSavings).toBeNull();
    expect(points[0]?.savingsTooltipSuffix).toBe(AMOUNT_NOT_RETURNED);
  });

  it("does not coerce omitted total savings to zero when run mix is known", () => {
    const points = mapSponsorRoiTrendSavingsChartPoints(
      [
        {
          snapshotUtc: "2026-05-15T00:00:00Z",
          totalEstimatedUsdSavings: undefined,
          realModeSavingsUsd: 0,
          realRunCount: 1,
          simulatorRunCount: 0,
        },
      ],
      true,
    );

    expect(points[0]?.totalEstimatedUsdSavings).toBeNull();
    expect(points[0]?.savingsTooltipSuffix).toBe(AMOUNT_NOT_RETURNED);
  });
});
