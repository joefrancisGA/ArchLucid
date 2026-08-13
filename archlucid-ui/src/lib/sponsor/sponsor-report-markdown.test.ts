import { describe, expect, it } from "vitest";

import { buildSponsorSummaryMarkdown } from "@/lib/sponsor/sponsor-report-markdown";
import manifest from "@/lib/data/roi-sponsor-facing-scope-labels.v1.json";
import { ROI_NON_ADDITIVITY_CAVEAT } from "@/lib/roi-sponsor-scope-labels";

describe("sponsor-report-markdown", () => {
  it("includes canonical headline scope and non-additivity caveat in export", () => {
    const markdown = buildSponsorSummaryMarkdown({
      totalEstimatedUsdSavings: 50_000,
      systemCount: 2,
      latestRunCount: 2,
      eaDiscountMultiplier: 1,
      savingsPricingBasis: "Estimate",
      systems: [
        {
          systemName: "Payments",
          runId: "run-1",
          committedUtc: "2026-06-01T00:00:00Z",
          estimatedUsdSavings: 30_000,
        },
        {
          systemName: "Identity",
          runId: "run-2",
          committedUtc: "2026-06-02T00:00:00Z",
          estimatedUsdSavings: 25_000,
        },
      ],
      topSystemicIssues: [],
    });

    expect(markdown).toContain(manifest.descriptions.headlineDispositionAware);
    expect(markdown).toContain(manifest.descriptions.systemRowSnapshotPotential);
    expect(markdown).toContain(ROI_NON_ADDITIVITY_CAVEAT);
  });

  it("prefers server scope labels when present", () => {
    const markdown = buildSponsorSummaryMarkdown({
      totalEstimatedUsdSavings: 10_000,
      systemCount: 1,
      latestRunCount: 1,
      eaDiscountMultiplier: 1,
      savingsPricingBasis: "Estimate",
      headlineSavingsScopeDescription: "Custom headline scope from API",
      systemRowSavingsScopeDescription: "Custom system-row scope from API",
      systems: [],
      topSystemicIssues: [],
    });

    expect(markdown).toContain("Custom headline scope from API");
    expect(markdown).toContain("Custom system-row scope from API");
  });
});
