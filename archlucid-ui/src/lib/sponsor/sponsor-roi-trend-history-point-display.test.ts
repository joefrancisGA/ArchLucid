import { describe, expect, it } from "vitest";

import {
  isSponsorRoiTrendSimulatorOnlyPeriod,
  sponsorRoiTrendCriticalFindingsDisplay,
} from "@/lib/sponsor/sponsor-roi-trend-history-point-display";

describe("sponsor-roi-trend-history-point-display", () => {
  it("labels missing critical counts as Not returned", () => {
    expect(sponsorRoiTrendCriticalFindingsDisplay({ criticalSecurityFindings: undefined })).toBe(
      "Not returned",
    );
  });

  it("requires returned run counts for simulator-only periods", () => {
    expect(
      isSponsorRoiTrendSimulatorOnlyPeriod({ realRunCount: 0, simulatorRunCount: 2 }),
    ).toBe(true);
    expect(
      isSponsorRoiTrendSimulatorOnlyPeriod({ realRunCount: undefined, simulatorRunCount: 2 }),
    ).toBe(false);
  });
});
