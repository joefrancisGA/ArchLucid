import { describe, expect, it } from "vitest";

import {
  BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_INTRO,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_PAGE_INTRO,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_INTRO,
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
  IDENTITY_PROVIDERS_SAML_PAGE_INTRO,
  IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
  identityProvidersPageSubtitle,
} from "@/lib/identity-providers-settings-copy";

describe("identity-providers-settings-copy", () => {
  it("uses shorter buyer identity providers subtitle", () => {
    expect(identityProvidersPageSubtitle(true)).toBe(BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE);
    expect(identityProvidersPageSubtitle(false)).toBe(IDENTITY_PROVIDERS_PAGE_SUBTITLE);
    expect(BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE.length).toBeLessThan(
      IDENTITY_PROVIDERS_PAGE_SUBTITLE.length,
    );
  });

  it("uses a distinct SAML shell subtitle instead of repeating the legacy page intro (TB-1923)", () => {
    expect(IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_SAML_PAGE_INTRO);
    expect(IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure saml");
  });

  it("uses a distinct diagnostics shell subtitle instead of configure workspace intro (TB-1906)", () => {
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_INTRO);
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_PAGE_SUBTITLE);
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_PAGE_INTRO);
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure workspace");
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure sign-in");
  });

  it("uses status framing for OIDC shell title instead of in-page configuration (TB-1911)", () => {
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_TITLE).toBe("OIDC/JWT status");
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_TITLE.toLowerCase()).not.toContain("configuration");
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_INTRO.toLowerCase()).toContain("review");
  });

  it("uses a distinct OIDC shell subtitle instead of configure workspace intro (TB-1912)", () => {
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_PAGE_SUBTITLE);
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_PAGE_INTRO);
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure workspace");
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure sign-in");
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE.toLowerCase()).toContain("review");
  });

  it("uses status-hub framing for role mapping shell title and intro (TB-1916)", () => {
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE).toBe("Role mapping status");
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE.toLowerCase()).not.toBe("role mapping");
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO.toLowerCase()).toContain("review");
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO.toLowerCase()).not.toContain("map identity provider");
  });
});
