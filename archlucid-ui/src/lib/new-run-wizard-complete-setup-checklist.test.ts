import { describe, expect, it } from "vitest";

import {
  resolveNewRunWizardCompleteSetupEmphasizedStepId,
  resolveNewRunWizardCompleteSetupSteps,
} from "@/lib/new-run-wizard-complete-setup-checklist";

describe("new-run-wizard-complete-setup-checklist", () => {
  it("emphasizes identity before evidence and start", () => {
    expect(
      resolveNewRunWizardCompleteSetupEmphasizedStepId({
        identityConfigured: false,
        evidenceConfigured: false,
        reviewStarted: false,
      }),
    ).toBe("identity");
  });

  it("marks review started when run exists", () => {
    const steps = resolveNewRunWizardCompleteSetupSteps({
      identityConfigured: true,
      evidenceConfigured: true,
      reviewStarted: true,
    });

    expect(steps.find((step) => step.id === "start")?.complete).toBe(true);
  });
});
