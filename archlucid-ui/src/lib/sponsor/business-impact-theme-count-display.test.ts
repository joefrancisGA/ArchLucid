import { describe, expect, it } from "vitest";

import { readBusinessImpactThemeCountsDisplay } from "@/lib/sponsor/business-impact-theme-count-display";

describe("readBusinessImpactThemeCountsDisplay", () => {
  it("returns Not returned when category counts are missing", () => {
    const display = readBusinessImpactThemeCountsDisplay({
      businessImpactCategoryCounts: undefined,
    } as never);

    expect(display.security).toBe("Not returned");
    expect(display.cost).toBe("Not returned");
  });

  it("formats finite theme counts", () => {
    const display = readBusinessImpactThemeCountsDisplay({
      businessImpactCategoryCounts: {
        securityThemeCount: 2,
        complianceThemeCount: 1,
        securityComplianceThemeCount: 0,
        reliabilityThemeCount: 3,
        costThemeCount: 0,
        governanceThemeCount: 1,
        otherThemeCount: 0,
      },
    } as never);

    expect(display.security).toBe("2");
    expect(display.reliability).toBe("3");
  });
});
