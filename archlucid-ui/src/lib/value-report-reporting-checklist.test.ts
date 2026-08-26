import { describe, expect, it } from "vitest";

import {
  resolveValueReportReportingEmphasizedStepId,
  resolveValueReportReportingSteps,
} from "./value-report-reporting-checklist";

describe("value-report-reporting-checklist", () => {
  it("emphasizes report review after a review is picked", () => {
    expect(
      resolveValueReportReportingEmphasizedStepId({
        reviewPicked: true,
        reportReviewed: false,
        exportReady: false,
      }),
    ).toBe("report");
  });

  it("marks all steps complete when export is ready", () => {
    const steps = resolveValueReportReportingSteps({
      reviewPicked: true,
      reportReviewed: true,
      exportReady: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveValueReportReportingEmphasizedStepId({
        reviewPicked: true,
        reportReviewed: true,
        exportReady: true,
      }),
    ).toBe("export");
  });
});
