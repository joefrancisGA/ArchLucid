import { describe, expect, it } from "vitest";

import {
  resolveSsoWizardCompleteSetupEmphasizedStepId,
  resolveSsoWizardCompleteSetupSteps,
} from "@/lib/sso-wizard-complete-setup-checklist";

describe("sso-wizard-complete-setup-checklist", () => {
  it("tracks setup progress", () => {
    expect(
      resolveSsoWizardCompleteSetupSteps({
        idpAndProtocolComplete: true,
        providerConfigured: false,
        verifiedAndReady: false,
      }),
    ).toEqual([
      { id: "idp", label: "Choose identity provider and protocol", complete: true },
      { id: "provider", label: "Configure provider metadata and role mapping", complete: false },
      { id: "verify", label: "Verify sign-in and save configuration", complete: false },
    ]);
  });

  it("emphasizes provider when missing", () => {
    expect(
      resolveSsoWizardCompleteSetupEmphasizedStepId({
        idpAndProtocolComplete: true,
        providerConfigured: false,
        verifiedAndReady: false,
      }),
    ).toBe("provider");
  });
});
