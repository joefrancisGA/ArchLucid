import { describe, expect, it } from "vitest";

import {
  areArchitectureScorecardAssumptionsComplete,
  architectureScorecardAssumptionFieldErrors,
  buildArchitectureScorecardRoiPreview,
  parseArchitectureScorecardRoiAssumptions,
} from "@/lib/architecture/architecture-scorecard-roi-preview";

describe("architecture-scorecard-roi-preview", () => {
  it("matches server 50% review-time lever math", () => {
    const assumptions = parseArchitectureScorecardRoiAssumptions("40", "12", "150");

    expect(assumptions).not.toBeNull();
    const preview = buildArchitectureScorecardRoiPreview(assumptions!);

    expect(preview.statusQuoAnnualUsd).toBe(12 * 4 * 40 * 150);
    expect(preview.annualSavingsUsd).toBe(preview.statusQuoAnnualUsd * 0.5);
    expect(preview.quarterlySavingsUsd).toBe(preview.annualSavingsUsd / 4);
  });

  it("requires all three positive fields before preview", () => {
    expect(areArchitectureScorecardAssumptionsComplete("", "12", "150")).toBe(false);
    expect(areArchitectureScorecardAssumptionsComplete("40", "12.5", "150")).toBe(false);
    expect(areArchitectureScorecardAssumptionsComplete("40", "12", "150")).toBe(true);
  });

  it("surfaces field errors only after the user types", () => {
    expect(architectureScorecardAssumptionFieldErrors("", "", "").hours).toBeNull();
    expect(architectureScorecardAssumptionFieldErrors("0", "12", "150").hours).toContain("greater than zero");
    expect(architectureScorecardAssumptionFieldErrors("40", "1.5", "150").reviews).toContain("whole reviews");
  });
});
