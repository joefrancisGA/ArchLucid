import { describe, expect, it } from "vitest";

import {
  resolveBaselineSaveEmphasizedStepId,
  resolveBaselineSaveSteps,
} from "@/lib/baseline-save-checklist";

describe("baseline-save-checklist", () => {
  it("marks steps complete in order", () => {
    expect(
      resolveBaselineSaveSteps({
        measurementsEntered: false,
        validationReady: false,
        saveComplete: false,
      }).map((step) => step.complete),
    ).toEqual([false, false, false]);

    expect(
      resolveBaselineSaveSteps({
        measurementsEntered: true,
        validationReady: true,
        saveComplete: true,
      }).map((step) => step.complete),
    ).toEqual([true, true, true]);
  });

  it("emphasizes the first incomplete step", () => {
    expect(
      resolveBaselineSaveEmphasizedStepId({
        measurementsEntered: false,
        validationReady: false,
        saveComplete: false,
      }),
    ).toBe("measurements");
  });
});
