import { describe, expect, it } from "vitest";

import { wizardBaselineConfidenceSourceNote } from "@/lib/wizard-baseline-confidence";

describe("wizardBaselineConfidenceSourceNote", () => {
  it("labels unsure baseline confidence as not chosen (P-11)", () => {
    expect(wizardBaselineConfidenceSourceNote("unsure")).toBe("Confidence was not chosen.");
  });

  it("keeps wizard prefix for measured and team estimate", () => {
    expect(wizardBaselineConfidenceSourceNote("measured")).toContain("wizard:");
    expect(wizardBaselineConfidenceSourceNote("team_estimate")).toContain("wizard:");
  });
});
