import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML,
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";
import { resolveIdentityProvidersOverview } from "@/lib/resolve-identity-providers-overview";

describe("resolveIdentityProvidersOverview", () => {
  it("recommends SAML configuration when SAML is not configured", () => {
    const overview = resolveIdentityProvidersOverview({
      authConfigurationDiagnostics: {
        authMode: "JwtBearer",
        audienceConfigured: true,
        issuerOrAuthorityConfigured: true,
        openIdDiscoverySucceeded: true,
        saml2Enabled: false,
        roleClaimNameConfigured: false,
        tenantClaimMappingConfigured: false,
      },
      identityProviderDiagnostics: null,
      oidcDiagnostics: {
        authMode: "JwtBearer",
        discoverySucceeded: true,
      },
    });

    expect(overview.samlStatus).toBe(IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED);
    expect(overview.recommendedNextStep).toBe(IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML);
    expect(overview.recommendedNextHref).toBe("/settings/identity-providers/saml");
  });

  it("maps local development sign-in without exposing DevelopmentBypass", () => {
    const overview = resolveIdentityProvidersOverview({
      authConfigurationDiagnostics: {
        authMode: "DevelopmentBypass",
        audienceConfigured: false,
        issuerOrAuthorityConfigured: false,
        openIdDiscoverySucceeded: null,
        saml2Enabled: false,
        roleClaimNameConfigured: false,
        tenantClaimMappingConfigured: false,
      },
      identityProviderDiagnostics: null,
      oidcDiagnostics: null,
    });

    expect(overview.authenticationModeLabel).toBe("Local development sign-in");
    expect(overview.usesLocalDevelopmentSignIn).toBe(true);
    expect(overview.roleMappingStatus).toBe("Not applicable");
  });

  it("marks healthy OIDC discovery", () => {
    const overview = resolveIdentityProvidersOverview({
      authConfigurationDiagnostics: {
        authMode: "JwtBearer",
        audienceConfigured: true,
        issuerOrAuthorityConfigured: true,
        openIdDiscoverySucceeded: true,
        saml2Enabled: true,
        tenantIdentityProviderProtocol: "Saml",
        roleClaimNameConfigured: true,
        tenantClaimMappingConfigured: true,
      },
      identityProviderDiagnostics: {
        oidc: { status: "Healthy" },
        saml: { status: "Healthy" },
      },
      oidcDiagnostics: {
        authMode: "JwtBearer",
        discoverySucceeded: true,
      },
    });

    expect(overview.oidcStatus).toBe(IDENTITY_PROVIDERS_STATUS_HEALTHY);
    expect(overview.samlStatus).toBe(IDENTITY_PROVIDERS_STATUS_ENABLED);
    expect(overview.ssoStatus).toBe(IDENTITY_PROVIDERS_STATUS_ENABLED);
  });
});
