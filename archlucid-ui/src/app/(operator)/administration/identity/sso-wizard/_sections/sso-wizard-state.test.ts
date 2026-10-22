import { describe, expect, it } from "vitest";

import {
  applySsoWizardIdpPreset,
  createDefaultSsoWizardState,
  SSO_WIZARD_STEPS,
  ssoWizardHasUnsavedChanges,
} from "./sso-wizard-state";

describe("sso-wizard-state", () => {
  it("places Identity provider at step 0 and Protocol at step 1", () => {
    expect(SSO_WIZARD_STEPS[0]?.label).toBe("Identity provider");
    expect(SSO_WIZARD_STEPS[1]?.label).toBe("Protocol");
    expect(SSO_WIZARD_STEPS[4]?.label).toBe("Verify claim mapping");
    expect(SSO_WIZARD_STEPS[4]?.description).toBe("Sandbox sign-in test with sample claim values");
    expect(SSO_WIZARD_STEPS[5]?.label).toBe("Save configuration");
    expect(SSO_WIZARD_STEPS[5]?.description).toBe("Review and save configuration");
    expect(SSO_WIZARD_STEPS).toHaveLength(6);
  });

  it("applies suggested OIDC for Entra and clears protocol for Other", () => {
    const base = createDefaultSsoWizardState();

    expect(applySsoWizardIdpPreset(base, "entra")).toMatchObject({
      idpPresetId: "entra",
      protocol: "oidc",
    });
    expect(applySsoWizardIdpPreset(base, "other")).toMatchObject({
      idpPresetId: "other",
      protocol: null,
    });
  });

  it("preserves hydrated protocol when selecting an IdP preset on an existing SAML record", () => {
    const hydrated = {
      ...createDefaultSsoWizardState(),
      protocol: "saml" as const,
      issuerUri: "https://idp.example.com",
    };

    expect(applySsoWizardIdpPreset(hydrated, "entra")).toMatchObject({
      idpPresetId: "entra",
      protocol: "saml",
    });
  });

  it("treats an identity-provider selection as unsaved on step 0", () => {
    const selected = applySsoWizardIdpPreset(createDefaultSsoWizardState(), "okta");
    expect(ssoWizardHasUnsavedChanges(createDefaultSsoWizardState(), 0)).toBe(false);
    expect(ssoWizardHasUnsavedChanges(selected, 0)).toBe(true);
  });
});
