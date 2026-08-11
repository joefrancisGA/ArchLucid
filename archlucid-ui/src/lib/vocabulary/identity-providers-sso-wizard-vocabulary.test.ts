import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE,
  IDENTITY_PROVIDERS_SSO_WIZARD_HEADING,
  IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK,
  IDENTITY_PROVIDERS_SSO_WIZARD_WHY_TWO,
  IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK,
  buildIdentityProvidersSsoWizardVocabulary,
  resolveIdentityProvidersSsoWizardPeerLink,
} from "@/lib/vocabulary/identity-providers-sso-wizard-vocabulary";
import { SSO_WIZARD_IDENTITY_PROVIDERS_HREF } from "@/lib/sso-wizard-copy";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";

describe("identity-providers-sso-wizard-vocabulary (TB-2277)", () => {
  it("explains identity providers hub vs SSO wizard", () => {
    const model = buildIdentityProvidersSsoWizardVocabulary();

    expect(model.heading).toBe(IDENTITY_PROVIDERS_SSO_WIZARD_HEADING);
    expect(model.heading.toLowerCase()).toContain("identity providers");
    expect(model.heading.toLowerCase()).toContain("sso wizard");
    expect(model.whyTwo).toBe(IDENTITY_PROVIDERS_SSO_WIZARD_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("hub");
    expect(model.whyTwo.toLowerCase()).toContain("activate");
    expect(model.compactLine).toBe(IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE);

    expect(model.identityProvidersLink).toEqual(IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK);
    expect(model.identityProvidersLink.href).toBe(SSO_WIZARD_IDENTITY_PROVIDERS_HREF);
    expect(model.identityProvidersLink.href).toBe("/administration/identity-providers");

    expect(model.ssoWizardLink).toEqual(IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK);
    expect(model.ssoWizardLink.href).toBe(SSO_WIZARD_CANONICAL_PATH);
    expect(model.ssoWizardLink.href).toBe("/administration/identity/sso-wizard");
  });

  it("resolves the peer surface from identity-providers and sso-wizard", () => {
    expect(resolveIdentityProvidersSsoWizardPeerLink("identity-providers")).toEqual(
      IDENTITY_PROVIDERS_SSO_WIZARD_WIZARD_LINK,
    );
    expect(resolveIdentityProvidersSsoWizardPeerLink("sso-wizard")).toEqual(
      IDENTITY_PROVIDERS_SSO_WIZARD_HUB_LINK,
    );
  });
});
