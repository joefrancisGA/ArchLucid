import { describe, expect, it } from "vitest";

import {
  resolveCompositeAlertRulesCreateEmphasizedStepId,
  resolveCompositeAlertRulesCreateSteps,
} from "@/lib/composite-alert-rules-create-checklist";

describe("composite-alert-rules-create-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveCompositeAlertRulesCreateEmphasizedStepId({
        nameAndSeverityConfigured: false,
        conditionsConfigured: false,
        ruleSaved: false,
      }),
    ).toBe("name");

    expect(
      resolveCompositeAlertRulesCreateEmphasizedStepId({
        nameAndSeverityConfigured: true,
        conditionsConfigured: false,
        ruleSaved: false,
      }),
    ).toBe("conditions");
  });

  it("returns three create steps", () => {
    const steps = resolveCompositeAlertRulesCreateSteps({
      nameAndSeverityConfigured: true,
      conditionsConfigured: true,
      ruleSaved: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
    expect(steps[0]?.complete).toBe(true);
  });
});
