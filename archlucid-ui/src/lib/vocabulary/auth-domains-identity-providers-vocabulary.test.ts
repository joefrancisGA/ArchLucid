import { describe, expect, it } from "vitest";

import {
  AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_HEADING,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK,
  AUTH_DOMAINS_IDENTITY_PROVIDERS_WHY_TWO,
  buildAuthDomainsIdentityProvidersVocabulary,
  resolveAuthDomainsIdentityProvidersPeerLink,
} from "@/lib/vocabulary/auth-domains-identity-providers-vocabulary";
import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { SCIM_IDENTITY_PROVIDERS_HREF } from "@/lib/scim-provisioning-page-copy";

describe("auth-domains-identity-providers-vocabulary (TB-2299)", () => {
  it("explains sign-in domains enforcement vs identity provider federation", () => {
    const model = buildAuthDomainsIdentityProvidersVocabulary();

    expect(model.heading).toBe(AUTH_DOMAINS_IDENTITY_PROVIDERS_HEADING);
    expect(model.whyTwo).toBe(AUTH_DOMAINS_IDENTITY_PROVIDERS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("domain");
    expect(model.whyTwo.toLowerCase()).toContain("federation");
    expect(model.compactLine).toBe(AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE);

    expect(model.authDomainsLink).toEqual(AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK);
    expect(model.authDomainsLink.href).toBe(AUTH_DOMAINS_SETTINGS_CANONICAL_PATH);
    expect(model.identityProvidersLink).toEqual(AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK);
    expect(model.identityProvidersLink.href).toBe(SCIM_IDENTITY_PROVIDERS_HREF);
  });

  it("resolves the peer surface from auth domains and identity providers", () => {
    expect(resolveAuthDomainsIdentityProvidersPeerLink("auth-domains")).toEqual(
      AUTH_DOMAINS_IDENTITY_PROVIDERS_IDP_LINK,
    );

    expect(resolveAuthDomainsIdentityProvidersPeerLink("identity-providers")).toEqual(
      AUTH_DOMAINS_IDENTITY_PROVIDERS_DOMAINS_LINK,
    );
  });
});
