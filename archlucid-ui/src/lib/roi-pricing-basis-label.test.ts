import { describe, expect, it } from "vitest";

import {
  formatExecutiveRoiPricingBasisLabel,
  formatRoiCostEvidenceFreshnessWarning,
  shouldShowRoiCostEvidenceFreshnessWarning,
} from "@/lib/roi-pricing-basis-label";

describe("roi-pricing-basis-label", () => {
  it("formats uploaded and EA-adjusted labels", () => {
    expect(formatExecutiveRoiPricingBasisLabel("Uploaded actual/amortized", 0.85)).toBe(
      "Uploaded actual/amortized (EA multiplier 0.85)",
    );
    expect(formatExecutiveRoiPricingBasisLabel("Heuristic fallback", 1)).toBe("Heuristic fallback estimates");
  });

  it("warns for stale and missing freshness", () => {
    expect(shouldShowRoiCostEvidenceFreshnessWarning("Stale")).toBe(true);
    expect(shouldShowRoiCostEvidenceFreshnessWarning("Fresh")).toBe(false);

    expect(formatRoiCostEvidenceFreshnessWarning("Stale", 90, "2026-01-01T00:00:00Z")).toContain("stale");
    expect(formatRoiCostEvidenceFreshnessWarning("Missing", 90, null)).toContain("No uploaded extractor");
  });
});
