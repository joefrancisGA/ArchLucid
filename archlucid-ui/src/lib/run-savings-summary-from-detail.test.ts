import { describe, expect, it } from "vitest";

import type { RunDetail } from "@/types/authority";

import { resolveRunSavingsSummaryFromRunDetail } from "./run-savings-summary-from-detail";

describe("resolveRunSavingsSummaryFromRunDetail", () => {
  it("maps server estimatedUsdSavingsSummary to the run savings card model", () => {
    const detail = {
      estimatedUsdSavingsSummary: {
        estimatedUsdSavings: 12500.4,
        savingsPricingBasis: "EA-adjusted",
        savingsPricingBasisDescription: "Tenant-adjusted sum of cost-category findings for this run.",
      },
    } as RunDetail;

    const model = resolveRunSavingsSummaryFromRunDetail(detail);

    expect(model).not.toBeNull();
    expect(model?.annualizedUsd).toBe(12500);
    expect(model?.basisFootnotes.join(" ")).toContain("Tenant-adjusted");
  });

  it("returns null when server savings are absent", () => {
    const detail = {} as RunDetail;

    expect(resolveRunSavingsSummaryFromRunDetail(detail)).toBeNull();
  });
});
