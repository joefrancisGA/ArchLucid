import { describe, expect, it } from "vitest";

import {
  resolveRoiSummarySummarizingEmphasizedStepId,
  resolveRoiSummarySummarizingSteps,
} from "./roi-summary-summarizing-checklist";

describe("roi-summary-summarizing-checklist", () => {
  it("emphasizes metrics when review is picked but metrics are not reviewed", () => {
    expect(
      resolveRoiSummarySummarizingEmphasizedStepId({
        reviewPicked: true,
        metricsReviewed: false,
        exportReady: false,
      }),
    ).toBe("metrics");
  });

  it("marks all steps complete when export is ready", () => {
    const steps = resolveRoiSummarySummarizingSteps({
      reviewPicked: true,
      metricsReviewed: true,
      exportReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveRoiSummarySummarizingEmphasizedStepId({
        reviewPicked: true,
        metricsReviewed: true,
        exportReady: true,
      }),
    ).toBe("export");
  });
});
