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

  it("includes ROI basis description footnote when savings are shown (FC-47)", () => {
    const result = presentSponsorEstimatedSavings(125000, {
      loading: false,
      summary: summary({
        systemCount: 1,
        totalEstimatedUsdSavings: 125000,
        savingsPricingBasisDescription: "List-price Azure retail rates.",
      }),
    });

    expect(result.display).toBe("$125,000");
    expect(result.footnote).toBe("List-price Azure retail rates.");
  });

  it("falls back to savingsPricingBasis label when description is absent (FC-47)", () => {
    const result = presentSponsorEstimatedSavings(50000, {
      loading: false,
      summary: summary({
        systemCount: 1,
        savingsPricingBasis: "Tenant-adjusted list pricing",
      }),
    });

    expect(result.footnote).toBe("Basis: Tenant-adjusted list pricing");
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
