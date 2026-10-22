import { describe, expect, it } from "vitest";

import {
  REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS,
  repeatReviewLoopHelpLoopSteps,
} from "@/lib/repeat-review-loop-help-loop-steps";

describe("repeat-review-loop help loop steps (TB-1398)", () => {
  it("exposes actionable CTAs for compare, replay, governance, and proof steps", () => {
    const steps = repeatReviewLoopHelpLoopSteps();

    expect(steps).toEqual([...REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS]);
    expect(steps.length).toBeGreaterThanOrEqual(4);

    const compareStep = steps.find((step) => step.stepNumber === 1);
    const governanceStep = steps.find((step) => step.stepNumber === 4);

    expect(compareStep?.href).toBe("/insights/compare-two-reviews");
    expect(governanceStep?.href).toContain("/governance/policy-packs");
    expect(steps.every((step) => step.href.length > 0 && step.ctaLabel.length > 0)).toBe(true);
  });
});
