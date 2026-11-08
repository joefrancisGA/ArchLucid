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

  it("states when portfolio counts were not stored (P-09, P-11–P-13)", () => {
    const markdown = buildSponsorSummaryMarkdown(
      minimalSummary({
        systemCount: Number.NaN,
        latestRunCount: undefined as unknown as number,
        savingsPricingBasis: "",
        eaDiscountMultiplier: Number.NaN,
      }),
    );

    expect(markdown).toContain("Systems reviewed count was not stored.");
    expect(markdown).toContain("Latest run count was not stored.");
    expect(markdown).toContain("Savings pricing basis was not stored.");
    expect(markdown).toContain("EA discount multiplier was not stored.");
    expect(markdown).toContain("Orphan candidate count was not stored.");
  });

  it("labels None severity and missing system names in export tables (P-04, P-09)", () => {
    const markdown = buildSponsorSummaryMarkdown(
      minimalSummary({
        topSystemicIssues: [{ category: "Cost", severity: "None", count: 2 }],
        systems: [{ systemName: "", runId: "run-a", committedUtc: null, estimatedUsdSavings: null }],
      }),
    );

    expect(markdown).toContain("No severity band was stored.");
    expect(markdown).toContain("System name was stored empty.");
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
