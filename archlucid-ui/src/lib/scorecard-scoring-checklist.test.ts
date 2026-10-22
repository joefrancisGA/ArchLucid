import { describe, expect, it } from "vitest";

import {
  resolveScorecardScoringEmphasizedStepId,
  resolveScorecardScoringSteps,
} from "./scorecard-scoring-checklist";

describe("scorecard-scoring-checklist", () => {
  it("emphasizes metrics after review is picked", () => {
    expect(
      resolveScorecardScoringEmphasizedStepId({
        reviewPicked: true,
        metricsReviewed: false,
        exportReady: false,
      }),
    ).toBe("metrics");
  });

  it("marks all steps complete when export is ready", () => {
    const steps = resolveScorecardScoringSteps({
      reviewPicked: true,
      metricsReviewed: true,
      exportReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveScorecardScoringEmphasizedStepId({
        reviewPicked: true,
        metricsReviewed: true,
        exportReady: true,
      }),
    ).toBe("export");
  });
});
