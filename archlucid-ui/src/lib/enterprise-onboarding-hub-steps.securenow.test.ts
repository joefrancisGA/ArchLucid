import { describe, expect, it } from "vitest";

import {
  enterpriseOnboardingHubStepCount,
  enterpriseOnboardingHubSteps,
  SECURENOW_ENTERPRISE_ONBOARDING_HUB_STEP_COUNT,
} from "@/lib/enterprise-onboarding-hub-steps";
import { enterpriseOnboardingHelpPrimaryActions } from "@/lib/enterprise-onboarding-help-copy";

describe("enterprise-onboarding-hub-steps SecureNow", () => {
  it("uses a seven-step SecureNow hub without architecture review or approval workflow", () => {
    const steps = enterpriseOnboardingHubSteps("security");

    expect(enterpriseOnboardingHubStepCount("security")).toBe(SECURENOW_ENTERPRISE_ONBOARDING_HUB_STEP_COUNT);
    expect(steps.map((step) => step.title)).not.toContain("Enable approval workflow");
    expect(steps.map((step) => step.title)).not.toContain("Validate first architecture review");
    expect(steps.some((step) => step.title.includes("findings"))).toBe(true);

    const validateStep = steps.find((step) => step.title.includes("findings"));
    expect(validateStep?.primaryLink.href).toContain("/compliance/findings");
    expect(validateStep?.primaryLink.href).not.toContain("first-architecture-review");
    expect(validateStep?.primaryLink.href).not.toContain("core-pilot");

    const actions = enterpriseOnboardingHelpPrimaryActions("security");
    expect("openCorePilot" in actions).toBe(false);
    expect(actions.openPolicyPacks.href).toBe("/compliance/policy-packs");
    expect(actions.openExtractUpload.href).toBe("/infrastructure/manual-upload");
  });

  it("keeps the eight-step architecture hub with first architecture review", () => {
    const steps = enterpriseOnboardingHubSteps("architecture");

    expect(enterpriseOnboardingHubStepCount("architecture")).toBe(8);
    expect(steps.map((step) => step.title)).toContain("Validate first architecture review");

    const actions = enterpriseOnboardingHelpPrimaryActions("architecture");
    expect("openCorePilot" in actions).toBe(true);
  });
});
