import { describe, expect, it } from "vitest";

import {
  resolveAlertRulesCreateEmphasizedStepId,
  resolveAlertRulesCreateSteps,
} from "@/lib/alert-rules-create-checklist";

describe("alert-rules-create-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveAlertRulesCreateEmphasizedStepId({
        signalConfigured: false,
        thresholdConfigured: false,
        ruleEnabled: false,
      }),
    ).toBe("signal");

    expect(
      resolveAlertRulesCreateEmphasizedStepId({
        signalConfigured: true,
        thresholdConfigured: false,
        ruleEnabled: false,
      }),
    ).toBe("threshold");
  });

  it("returns three create steps", () => {
    const steps = resolveAlertRulesCreateSteps({
      signalConfigured: true,
      thresholdConfigured: true,
      ruleEnabled: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
  });
});
