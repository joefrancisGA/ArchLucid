import { describe, expect, it } from "vitest";

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
    expect(points[0]?.savingsTooltipSuffix).toBe("Run mix not returned");
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
    expect(points[0]?.savingsTooltipSuffix).toBe("Amount not returned");
  });
});
