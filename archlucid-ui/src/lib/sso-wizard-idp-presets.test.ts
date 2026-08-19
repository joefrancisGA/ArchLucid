import { describe, expect, it } from "vitest";

import {
  getSsoWizardIdpPreset,
  isSsoWizardIdpPresetId,
  resolveSuggestedProtocolForIdp,
  SSO_WIZARD_IDP_PRESETS,
} from "@/lib/sso-wizard-idp-presets";

describe("sso-wizard-idp-presets", () => {
  it("exposes buyer-facing labels for Entra, Okta, Auth0, and Other", () => {
    expect(SSO_WIZARD_IDP_PRESETS.map((preset) => preset.id)).toEqual([
      "entra",
      "okta",
      "auth0",
      "other",
    ]);
    expect(SSO_WIZARD_IDP_PRESETS.map((preset) => preset.label)).toEqual([
      "Microsoft Entra ID",
      "Okta",
      "Auth0",
      "Other",
    ]);
  });

  it("suggests OIDC for known providers and null for Other", () => {
    expect(resolveSuggestedProtocolForIdp("entra")).toBe("oidc");
    expect(resolveSuggestedProtocolForIdp("okta")).toBe("oidc");
    expect(resolveSuggestedProtocolForIdp("auth0")).toBe("oidc");
    expect(resolveSuggestedProtocolForIdp("other")).toBeNull();
  });

  it("looks up presets by id and validates id strings", () => {
    expect(getSsoWizardIdpPreset("entra")?.label).toBe("Microsoft Entra ID");
    expect(getSsoWizardIdpPreset("other")?.suggestedProtocol).toBeNull();
    expect(isSsoWizardIdpPresetId("okta")).toBe(true);
    expect(isSsoWizardIdpPresetId("ping")).toBe(false);
  });

  it("avoids jargon labels such as IdP entity", () => {
    const joined = SSO_WIZARD_IDP_PRESETS.map((preset) => `${preset.label} ${preset.description}`).join(
      " ",
    );

    expect(joined).not.toMatch(/IdP entity/i);
  });
});
