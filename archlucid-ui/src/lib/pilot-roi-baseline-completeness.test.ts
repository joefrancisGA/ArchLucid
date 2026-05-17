import { describe, expect, it } from "vitest";

import { coerceFinitePositiveHours, isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";

describe("pilot-roi-baseline-completeness", () => {
  it("coerceFinitePositiveHours rejects non-positive and non-finite values", () => {
    expect(coerceFinitePositiveHours(null)).toBeNull();
    expect(coerceFinitePositiveHours(undefined)).toBeNull();
    expect(coerceFinitePositiveHours("")).toBeNull();
    expect(coerceFinitePositiveHours(0)).toBeNull();
    expect(coerceFinitePositiveHours(-3)).toBeNull();
    expect(coerceFinitePositiveHours(Number.NaN)).toBeNull();
    expect(coerceFinitePositiveHours("12")).toBe(12);
    expect(coerceFinitePositiveHours(4.25)).toBe(4.25);
  });

  it("isPilotRoiBaselineComplete requires both anchors", () => {
    expect(
      isPilotRoiBaselineComplete({
        baselineReviewCycleHours: 40,
        manualPrepHoursPerReview: 6,
      }),
    ).toBe(true);

    expect(
      isPilotRoiBaselineComplete({
        baselineReviewCycleHours: null,
        manualPrepHoursPerReview: 6,
      }),
    ).toBe(false);

    expect(
      isPilotRoiBaselineComplete({
        baselineReviewCycleHours: 40,
        manualPrepHoursPerReview: null,
      }),
    ).toBe(false);
  });
});
