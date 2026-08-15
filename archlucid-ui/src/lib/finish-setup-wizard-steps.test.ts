import { describe, expect, it } from "vitest";

import {
  countFinishSetupReadySteps,
  FINISH_SETUP_SYSTEM_HEALTH_PATH,
  FINISH_SETUP_WIZARD_STEPS,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";

describe("finish-setup-wizard-steps", () => {
  it("links platform health to the buyer-safe /health route", () => {
    const healthStep = FINISH_SETUP_WIZARD_STEPS.find((step) => step.id === "health");

    expect(healthStep).toBeDefined();
    expect(healthStep?.href).toBe(FINISH_SETUP_SYSTEM_HEALTH_PATH);
    expect(healthStep?.href).not.toContain("/internal/health");
  });

  it("omits the health step on managed SaaS deployments", () => {
    const steps = resolveFinishSetupWizardSteps({ selfHosted: false });

    expect(steps.some((step) => step.id === "health")).toBe(false);
    expect(steps.every((step) => step.href !== "/internal/health")).toBe(true);
  });

  it("keeps the health step on self-hosted deployments", () => {
    const steps = resolveFinishSetupWizardSteps({ selfHosted: true });
    const healthStep = steps.find((step) => step.id === "health");

    expect(healthStep?.href).toBe("/administration/system-health");
  });

  it("does not include cloud inventory evidence — Core Pilot walkthrough owns that link", () => {
    expect(FINISH_SETUP_WIZARD_STEPS.some((step) => step.id === "extract")).toBe(false);
    expect(FINISH_SETUP_WIZARD_STEPS.some((step) => step.href === "/administration/extract-upload")).toBe(false);
  });

  it("counts identity as ready only when identityConfigured is explicitly true", () => {
    const managedSaas = { selfHosted: false } as const;

    expect(
      countFinishSetupReadySteps(
        {
          healthReady: true,
          healthLoadFailed: false,
          principalAdmin: true,
          identityConfigured: true,
        },
        managedSaas,
      ),
    ).toEqual({ ready: 2, total: 2 });

    expect(
      countFinishSetupReadySteps(
        {
          healthReady: true,
          healthLoadFailed: false,
          principalAdmin: true,
          identityConfigured: false,
        },
        managedSaas,
      ),
    ).toEqual({ ready: 1, total: 2 });

    expect(
      countFinishSetupReadySteps(
        {
          healthReady: true,
          healthLoadFailed: false,
          principalAdmin: true,
        },
        managedSaas,
      ),
    ).toEqual({ ready: 1, total: 2 });
  });
});
