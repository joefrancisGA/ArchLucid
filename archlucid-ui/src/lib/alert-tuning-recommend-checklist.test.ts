import { describe, expect, it } from "vitest";

import {
  resolveAlertTuningRecommendEmphasizedStepId,
  resolveAlertTuningRecommendSteps,
} from "@/lib/alert-tuning-recommend-checklist";

describe("alert-tuning-recommend-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveAlertTuningRecommendEmphasizedStepId({
        signalChosen: false,
        windowSet: false,
        recommendComplete: false,
      }),
    ).toBe("signal");

    expect(
      resolveAlertTuningRecommendEmphasizedStepId({
        signalChosen: true,
        windowSet: false,
        recommendComplete: false,
      }),
    ).toBe("window");

    expect(
      resolveAlertTuningRecommendEmphasizedStepId({
        signalChosen: true,
        windowSet: true,
        recommendComplete: false,
      }),
    ).toBe("recommend");
  });

  it("returns three recommend steps", () => {
    const steps = resolveAlertTuningRecommendSteps({
      signalChosen: true,
      windowSet: true,
      recommendComplete: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[0]?.complete).toBe(true);
    expect(steps[1]?.complete).toBe(true);
    expect(steps[2]?.complete).toBe(false);
  });

  it("emphasizes recommend when every step is complete", () => {
    expect(
      resolveAlertTuningRecommendEmphasizedStepId({
        signalChosen: true,
        windowSet: true,
        recommendComplete: true,
      }),
    ).toBe("recommend");
  });
});
