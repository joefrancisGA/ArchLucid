import { describe, expect, it } from "vitest";

import { presentSponsorEstimatedSavings, workspaceHasCostEvidenceBasis } from "@/lib/sponsor/sponsor-estimated-savings-display";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";

function summary(partial: Partial<SponsorRoiSummary>): SponsorRoiSummary {
  return {
    systemCount: 0,
    latestRunCount: 0,
    totalEstimatedUsdSavings: 0,
    topSystemicIssues: [],
    ...partial,
  } as SponsorRoiSummary;
}

describe("presentSponsorEstimatedSavings", () => {
  it("returns not available yet when there are no committed reviews", () => {
    const result = presentSponsorEstimatedSavings(0, { loading: false, summary: summary({}) });

    expect(result.display).toBe("Not available yet");
    expect(result.footnote).toContain("Finalize reviews");
  });

  it("shows measured zero when reviews and cost evidence exist", () => {
    const result = presentSponsorEstimatedSavings(0, {
      loading: false,
      summary: summary({
        systemCount: 2,
        costEvidenceFreshnessStatus: "Fresh",
      }),
    });

    expect(result.display).toBe("$0");
    expect(result.footnote).toBeNull();
  });

  it("formats positive savings when reviews exist", () => {
    const result = presentSponsorEstimatedSavings(125000, {
      loading: false,
      summary: summary({ systemCount: 1, totalEstimatedUsdSavings: 125000 }),
    });

    expect(result.display).toBe("$125,000");
  });
});

describe("workspaceHasCostEvidenceBasis", () => {
  it("treats demo pricing basis as configured evidence", () => {
    expect(
      workspaceHasCostEvidenceBasis(summary({ savingsPricingBasis: "Illustrative demo pricing" })),
    ).toBe(true);
  });

  it("returns false for missing freshness status", () => {
    expect(workspaceHasCostEvidenceBasis(summary({ costEvidenceFreshnessStatus: "Missing" }))).toBe(false);
  });
});
