import { describe, expect, it } from "vitest";

import { presentBusinessImpactThemeCounts } from "@/lib/sponsor/business-impact-theme-count-display";

describe("presentBusinessImpactThemeCounts", () => {
  it("labels omitted theme counts as Not returned", () => {
    expect(
      presentBusinessImpactThemeCounts({
        securityThemeCount: 2,
        complianceThemeCount: undefined,
      }).compliance,
    ).toBe("Not returned");
    expect(presentBusinessImpactThemeCounts(undefined).security).toBe("Not returned");
  });
});
