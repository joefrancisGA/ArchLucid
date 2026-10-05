import { describe, expect, it } from "vitest";

import {
  buildSponsorRoiTrendCriticalBarAriaLabel,
  finiteSponsorRoiHistoryCount,
  isSponsorRoiTrendSimulatorOnlyPeriod,
  sponsorRoiTrendCriticalBarHeightPx,
  sponsorRoiTrendCriticalFindingsDisplay,
  sponsorRoiTrendCriticalFindingsForScale,
  sponsorRoiTrendSimulatorOnlyBadgeLabel,
} from "@/lib/sponsor/sponsor-roi-trend-history-point-display";

describe("sponsor-roi-trend-history-point-display", () => {
  it("labels missing history counts as Not returned", () => {
    expect(finiteSponsorRoiHistoryCount(undefined)).toBeNull();
    expect(sponsorRoiTrendCriticalFindingsDisplay({ criticalSecurityFindings: undefined })).toBe("Not returned");
  });

  it("excludes missing critical counts from bar scale maximum", () => {
    expect(
      sponsorRoiTrendCriticalFindingsForScale([
        { criticalSecurityFindings: undefined },
        { criticalSecurityFindings: 4 },
      ]),
    ).toBe(4);
    expect(sponsorRoiTrendCriticalBarHeightPx({ criticalSecurityFindings: undefined }, 4)).toBe(8);
  });

  it("detects simulator-only periods only when counts are returned", () => {
    expect(
      isSponsorRoiTrendSimulatorOnlyPeriod({ realRunCount: 0, simulatorRunCount: 2 }),
    ).toBe(true);
    expect(
      isSponsorRoiTrendSimulatorOnlyPeriod({ realRunCount: undefined, simulatorRunCount: 2 }),
    ).toBe(false);
    expect(sponsorRoiTrendSimulatorOnlyBadgeLabel(false)).toBe("Simulator runs only");
  });

  it("builds operator aria labels with Not returned run counts", () => {
    expect(
      buildSponsorRoiTrendCriticalBarAriaLabel(
        {
          criticalSecurityFindings: 1,
          realRunCount: undefined,
          simulatorRunCount: 2,
          snapshotUtc: "2026-05-15T00:00:00Z",
        },
        "May 26",
        false,
      ),
    ).toContain("Not returned");
  });
});
