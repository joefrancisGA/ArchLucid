import { describe, expect, it } from "vitest";

import {
  resolveAlertsInboxTriageEmphasizedStepId,
  resolveAlertsInboxTriageSteps,
} from "./alerts-inbox-triage-checklist";

describe("alerts-inbox-triage-checklist", () => {
  it("emphasizes alert selection when review is scoped", () => {
    expect(
      resolveAlertsInboxTriageEmphasizedStepId({
        reviewPicked: true,
        alertSelected: false,
        triageActionComplete: false,
      }),
    ).toBe("select");
  });

  it("marks triage complete when acknowledge step is done", () => {
    const steps = resolveAlertsInboxTriageSteps({
      reviewPicked: true,
      alertSelected: true,
      triageActionComplete: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
