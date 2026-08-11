import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
} from "@/lib/identity-providers-settings-copy";
import { resolveRoleMappingPrimaryCta } from "@/lib/role-mapping-page-cta";

describe("role-mapping-page-cta", () => {
  it("routes SAML tenants to the SAML configuration editor (TB-1919)", () => {
    expect(
      resolveRoleMappingPrimaryCta({
        authMode: "JwtBearer",
        tenantIdentityProviderProtocol: "Saml",
        roleClaimNameConfigured: true,
      }),
    ).toEqual({
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
      href: "/administration/identity-providers/saml",
    });
  });

  it("routes OIDC/JWT tenants to the SSO wizard instead of SAML editor (TB-1919)", () => {
    expect(
      resolveRoleMappingPrimaryCta({
        authMode: "JwtBearer",
        tenantIdentityProviderProtocol: null,
        roleClaimNameConfigured: true,
      }),
    ).toEqual({
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
      href: "/administration/identity/sso-wizard",
    });
  });

  it("routes host-level SAML tenants to the SAML editor when tenant protocol is unset (TB-1919)", () => {
    expect(
      resolveRoleMappingPrimaryCta({
        authMode: "JwtBearer",
        tenantIdentityProviderProtocol: null,
        saml2Enabled: true,
        roleClaimNameConfigured: true,
      }),
    ).toEqual({
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
      href: "/administration/identity-providers/saml",
    });
  });
});
