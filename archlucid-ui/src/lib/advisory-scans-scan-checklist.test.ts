import { describe, expect, it } from "vitest";

import {
  resolveAdvisoryScansScanEmphasizedStepId,
  resolveAdvisoryScansScanSteps,
} from "./advisory-scans-scan-checklist";

describe("advisory-scans-scan-checklist", () => {
  it("emphasizes configure when review is picked but scan is not configured", () => {
    expect(
      resolveAdvisoryScansScanEmphasizedStepId({
        reviewPicked: true,
        scanConfigured: false,
        scanComplete: false,
      }),
    ).toBe("configure");
  });

  it("marks all steps complete when scan results are loaded", () => {
    const steps = resolveAdvisoryScansScanSteps({
      reviewPicked: true,
      scanConfigured: true,
      scanComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveAdvisoryScansScanEmphasizedStepId({
        reviewPicked: true,
        scanConfigured: true,
        scanComplete: true,
      }),
    ).toBe("scan");
  });
});
