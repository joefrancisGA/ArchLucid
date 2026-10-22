import { describe, expect, it } from "vitest";

import {
  resolveAlertSimulationRunEmphasizedStepId,
  resolveAlertSimulationRunSteps,
} from "./alert-simulation-run-checklist";

describe("alert-simulation-run-checklist", () => {
  it("emphasizes inputs when review is picked but inputs are not configured", () => {
    expect(
      resolveAlertSimulationRunEmphasizedStepId({
        reviewPicked: true,
        inputsConfigured: false,
        dryRunComplete: false,
      }),
    ).toBe("inputs");
  });

  it("marks all steps complete when dry-run is complete", () => {
    const steps = resolveAlertSimulationRunSteps({
      reviewPicked: true,
      inputsConfigured: true,
      dryRunComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolveAlertSimulationRunEmphasizedStepId({
        reviewPicked: true,
        inputsConfigured: true,
        dryRunComplete: true,
      }),
    ).toBe("dry-run");
  });
});
