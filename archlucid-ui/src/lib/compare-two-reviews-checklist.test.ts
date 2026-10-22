import { describe, expect, it } from "vitest";

import {
  resolveCompareTwoReviewsEmphasizedStepId,
  resolveCompareTwoReviewsSteps,
} from "@/lib/compare-two-reviews-checklist";

describe("compare-two-reviews-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveCompareTwoReviewsEmphasizedStepId({
        priorPicked: false,
        laterPicked: false,
        compareComplete: false,
      }),
    ).toBe("prior");

    expect(
      resolveCompareTwoReviewsEmphasizedStepId({
        priorPicked: true,
        laterPicked: false,
        compareComplete: false,
      }),
    ).toBe("later");
  });

  it("returns three compare steps", () => {
    const steps = resolveCompareTwoReviewsSteps({
      priorPicked: true,
      laterPicked: true,
      compareComplete: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
    expect(steps[0]?.complete).toBe(true);
  });
});
