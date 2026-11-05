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

  it("shows no evidence file stored when past evidence step without a pending file (P-19)", () => {
    const steps = resolveNewRunWizardCompleteSetupSteps({
      identityConfigured: true,
      evidenceConfigured: false,
      evidenceStepPastWithoutFile: true,
      reviewStarted: false,
    });

    expect(steps.find((step) => step.id === "evidence")?.complete).toBe(false);
    expect(steps.find((step) => step.id === "evidence")?.incompleteStatusLabel).toBe(
      "No evidence file stored.",
    );
  });
});
