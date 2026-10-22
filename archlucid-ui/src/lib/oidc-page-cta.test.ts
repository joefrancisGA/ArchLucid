import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS,
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
  IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF,
  IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
} from "@/lib/identity-providers-settings-copy";
import {
  oidcPageNeedsDiscoveryReview,
  resolveOidcPagePrimaryCta,
  resolveOidcPageSecondaryCta,
} from "@/lib/oidc-page-cta";

describe("oidc-page-cta", () => {
  it("treats failed discovery as needs review (TB-1914)", () => {
    expect(
      oidcPageNeedsDiscoveryReview(
        {
          authMode: "JwtBearer",
          discoveryAttempted: true,
          discoverySucceeded: false,
        },
        "Healthy",
      ),
    ).toBe(true);
  });

  it("treats unattempted discovery as needs review", () => {
    expect(
      oidcPageNeedsDiscoveryReview(
        {
          authMode: "JwtBearer",
          discoveryAttempted: false,
          discoverySucceeded: null,
        },
        "Healthy",
      ),
    ).toBe(true);
  });

  it("routes unconfigured tenants to SSO wizard primary CTA (TB-1914)", () => {
    expect(resolveOidcPagePrimaryCta(null, "Not configured")).toEqual({
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
      href: "/administration/identity/sso-wizard",
    });
    expect(resolveOidcPageSecondaryCta(null, "Not configured")).toEqual({
      label: IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS,
      href: IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
    });
  });

  it("routes needs-review tenants to diagnostics OIDC section primary CTA (TB-1914)", () => {
    expect(resolveOidcPagePrimaryCta(null, IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW)).toEqual({
      label: IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY,
      href: IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF,
    });
    expect(resolveOidcPageSecondaryCta(null, IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW)).toEqual({
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
      href: "/administration/identity/sso-wizard",
    });
  });
});
