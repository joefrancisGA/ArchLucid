import { describe, expect, it } from "vitest";

import {
  resolveImpactPreviewSimulateEmphasizedStepId,
  resolveImpactPreviewSimulateSteps,
} from "@/lib/impact-preview-simulate-checklist";

describe("impact-preview-simulate-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveImpactPreviewSimulateEmphasizedStepId({
        baselinePicked: false,
        candidatePicked: false,
        simulateComplete: false,
      }),
    ).toBe("baseline");

    expect(
      resolveImpactPreviewSimulateEmphasizedStepId({
        baselinePicked: true,
        candidatePicked: false,
        simulateComplete: false,
      }),
    ).toBe("candidate");
  });

  it("returns three simulate steps", () => {
    const steps = resolveImpactPreviewSimulateSteps({
      baselinePicked: true,
      candidatePicked: true,
      simulateComplete: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
    expect(steps[0]?.complete).toBe(true);
  });
});
