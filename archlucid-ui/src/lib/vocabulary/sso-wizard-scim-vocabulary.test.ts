import { describe, expect, it } from "vitest";

import {
  SSO_WIZARD_SCIM_COMPACT_LINE,
  SSO_WIZARD_SCIM_HEADING,
  SSO_WIZARD_SCIM_SCIM_LINK,
  SSO_WIZARD_SCIM_SSO_WIZARD_LINK,
  SSO_WIZARD_SCIM_WHY_TWO,
  buildSsoWizardScimVocabulary,
  resolveSsoWizardScimPeerLink,
} from "@/lib/vocabulary/sso-wizard-scim-vocabulary";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

describe("sso-wizard-scim-vocabulary (TB-2326)", () => {
  it("explains SSO sign-in setup vs SCIM directory sync", () => {
    const model = buildSsoWizardScimVocabulary();

    expect(model.heading).toBe(SSO_WIZARD_SCIM_HEADING);
    expect(model.heading.toLowerCase()).toContain("sso");
    expect(model.heading.toLowerCase()).toContain("scim");
    expect(model.whyTwo).toBe(SSO_WIZARD_SCIM_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("sign-in");
    expect(model.whyTwo.toLowerCase()).toContain("directory sync");
    expect(model.compactLine).toBe(SSO_WIZARD_SCIM_COMPACT_LINE);

    expect(model.ssoWizardLink).toEqual(SSO_WIZARD_SCIM_SSO_WIZARD_LINK);
    expect(model.ssoWizardLink.href).toBe(SSO_WIZARD_CANONICAL_PATH);

    expect(model.scimLink).toEqual(SSO_WIZARD_SCIM_SCIM_LINK);
    expect(model.scimLink.href).toBe(SCIM_PROVISIONING_CANONICAL_PATH);
  });

  it("resolves the peer surface from sso-wizard and scim", () => {
    expect(resolveSsoWizardScimPeerLink("sso-wizard")).toEqual(SSO_WIZARD_SCIM_SCIM_LINK);
    expect(resolveSsoWizardScimPeerLink("scim")).toEqual(SSO_WIZARD_SCIM_SSO_WIZARD_LINK);
  });
});
