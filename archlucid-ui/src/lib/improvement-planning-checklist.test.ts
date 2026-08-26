import { describe, expect, it } from "vitest";

import {
  resolveImprovementPlanningEmphasizedStepId,
  resolveImprovementPlanningSteps,
} from "./improvement-planning-checklist";

describe("improvement-planning-checklist", () => {
  it("emphasizes theme review after review is picked", () => {
    expect(
      resolveImprovementPlanningEmphasizedStepId({
        reviewPicked: true,
        themesReviewed: false,
        planReady: false,
      }),
    ).toBe("themes");
  });

  it("marks all steps complete when plan is ready", () => {
    const steps = resolveImprovementPlanningSteps({
      reviewPicked: true,
      themesReviewed: true,
      planReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
