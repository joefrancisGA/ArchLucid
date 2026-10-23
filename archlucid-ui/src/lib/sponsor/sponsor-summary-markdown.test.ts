import { describe, expect, it } from "vitest";

import { buildSponsorSummaryMarkdown, type SponsorRoiSummary } from "./sponsor-summary-markdown";

function minimalSummary(overrides: Partial<SponsorRoiSummary> = {}): SponsorRoiSummary {
  return {
    totalEstimatedUsdSavings: 0,
    systemCount: 0,
    latestRunCount: 0,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "test",
    systems: [],
    topSystemicIssues: [],
    ...overrides,
  };
}

describe("buildSponsorSummaryMarkdown realized value honesty", () => {
  it("states when realized value was not stored", () => {
    const markdown = buildSponsorSummaryMarkdown(minimalSummary());

    expect(markdown).toContain("Realized value was not stored.");
  });

  it("states when median time to remediation was not stored", () => {
    const markdown = buildSponsorSummaryMarkdown(
      minimalSummary({
        realizedValue: {
          findingsRemediatedCount30Days: 0,
          activeWaiversCount: 0,
          waiversRetiredCount30Days: 0,
          medianTimeToRemediationDays: null,
        },
      }),
    );

    expect(markdown).toContain("Median time to remediation was not stored.");
  });

  it("prints zero median when stored as zero", () => {
    const markdown = buildSponsorSummaryMarkdown(
      minimalSummary({
        realizedValue: {
          findingsRemediatedCount30Days: 1,
          activeWaiversCount: 0,
          waiversRetiredCount30Days: 0,
          medianTimeToRemediationDays: 0,
        },
      }),
    );

    expect(markdown).toContain("**Median time to remediation (days):** 0");
  });
});
