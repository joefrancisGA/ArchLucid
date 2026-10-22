import { describe, expect, it } from "vitest";

import {
  resolveArchitectureIntelligenceAnalysisEmphasizedStepId,
  resolveArchitectureIntelligenceAnalysisSteps,
} from "@/lib/architecture-intelligence-analysis-checklist";

describe("architecture-intelligence-analysis-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveArchitectureIntelligenceAnalysisEmphasizedStepId({
        reviewPicked: false,
        descriptionWritten: false,
        analysisComplete: false,
      }),
    ).toBe("review");

    expect(
      resolveArchitectureIntelligenceAnalysisEmphasizedStepId({
        reviewPicked: true,
        descriptionWritten: false,
        analysisComplete: false,
      }),
    ).toBe("description");

    expect(
      resolveArchitectureIntelligenceAnalysisEmphasizedStepId({
        reviewPicked: true,
        descriptionWritten: true,
        analysisComplete: false,
      }),
    ).toBe("analyze");
  });

  it("returns three analysis steps", () => {
    const steps = resolveArchitectureIntelligenceAnalysisSteps({
      reviewPicked: true,
      descriptionWritten: true,
      analysisComplete: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[0]?.complete).toBe(true);
    expect(steps[1]?.complete).toBe(true);
    expect(steps[2]?.complete).toBe(false);
  });

  it("emphasizes analyze when every step is complete", () => {
    expect(
      resolveArchitectureIntelligenceAnalysisEmphasizedStepId({
        reviewPicked: true,
        descriptionWritten: true,
        analysisComplete: true,
      }),
    ).toBe("analyze");
  });
});
