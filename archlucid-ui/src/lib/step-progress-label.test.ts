import { describe, expect, it } from "vitest";

import {
  formatStepProgressCompleteLabel,
  resolveStepProgressPercent,
} from "@/lib/step-progress-label";

describe("formatStepProgressCompleteLabel", () => {
  it("states completed count against the total", () => {
    expect(formatStepProgressCompleteLabel(0, 7)).toBe("0 of 7 steps complete");
    expect(formatStepProgressCompleteLabel(3, 7)).toBe("3 of 7 steps complete");
  });
});

describe("resolveStepProgressPercent", () => {
  it("rounds the completion fraction to a whole percent", () => {
    expect(resolveStepProgressPercent(0, 7)).toBe(0);
    expect(resolveStepProgressPercent(3, 7)).toBe(43);
    expect(resolveStepProgressPercent(7, 7)).toBe(100);
  });

  it("returns zero rather than NaN when no steps are tracked", () => {
    expect(resolveStepProgressPercent(0, 0)).toBe(0);
  });

  it("clamps counts outside the tracked range", () => {
    expect(resolveStepProgressPercent(9, 7)).toBe(100);
    expect(resolveStepProgressPercent(-1, 7)).toBe(0);
  });
});
