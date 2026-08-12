import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
  IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
  IDENTITY_PROVIDERS_STATUS_UNKNOWN,
  IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET,
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
      authConfigurationDiagnosticsAvailable: true,
      identityProviderDiagnostics: null,
      identityProviderDiagnosticsAvailable: false,
      oidcDiagnostics: {
        authMode: "JwtBearer",
        discoverySucceeded: true,
      },
      oidcDiagnosticsAvailable: true,
    });

    expect(overview.samlStatus).toBe(IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED);
    expect(overview.recommendedNextStep).toBe(IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML);
    expect(overview.recommendedNextHref).toBe("/administration/identity-providers/saml");
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
      authConfigurationDiagnosticsAvailable: true,
      identityProviderDiagnostics: null,
      identityProviderDiagnosticsAvailable: false,
      oidcDiagnostics: null,
      oidcDiagnosticsAvailable: false,
    });

    expect(overview.authenticationModeLabel).toBe("Local development sign-in");
    expect(overview.usesLocalDevelopmentSignIn).toBe(true);
    expect(overview.roleMappingStatus).toBe(IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE);
    expect(overview.tileCaptions.roleMapping).toBe(IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON);
    expect(overview.recommendedNextHref).toBe(IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF);
    expect(overview.recommendedNextStep).toBe(IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN);
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
      authConfigurationDiagnosticsAvailable: true,
      identityProviderDiagnostics: {
        oidc: { status: "Healthy" },
        saml: { status: "Healthy" },
      },
      identityProviderDiagnosticsAvailable: true,
      oidcDiagnostics: {
        authMode: "JwtBearer",
        discoverySucceeded: true,
      },
      oidcDiagnosticsAvailable: true,
    });

    expect(overview.oidcStatus).toBe(IDENTITY_PROVIDERS_STATUS_HEALTHY);
    expect(overview.samlStatus).toBe(IDENTITY_PROVIDERS_STATUS_ENABLED);
    expect(overview.ssoStatus).toBe(IDENTITY_PROVIDERS_STATUS_ENABLED);
    expect(overview.validationStatusLabel).toBe(IDENTITY_PROVIDERS_STATUS_HEALTHY);
    expect(overview.headerStatusAvailable).toBe(true);
  });

  it("returns Unknown when auth configuration diagnostics are unavailable", () => {
    const overview = resolveIdentityProvidersOverview({
      authConfigurationDiagnostics: null,
      authConfigurationDiagnosticsAvailable: false,
      identityProviderDiagnostics: {
        oidc: { status: "Healthy" },
        saml: { status: "NotApplicable" },
      },
      identityProviderDiagnosticsAvailable: true,
      oidcDiagnostics: null,
      oidcDiagnosticsAvailable: false,
    });

    expect(overview.authenticationModeLabel).toBe(IDENTITY_PROVIDERS_STATUS_UNKNOWN);
    expect(overview.samlStatus).toBe(IDENTITY_PROVIDERS_STATUS_UNKNOWN);
    expect(overview.roleMappingStatus).toBe(IDENTITY_PROVIDERS_STATUS_UNKNOWN);
    expect(overview.ssoStatus).toBe(IDENTITY_PROVIDERS_STATUS_UNKNOWN);
    expect(overview.oidcStatus).toBe(IDENTITY_PROVIDERS_STATUS_UNKNOWN);
    expect(overview.tileCaptions.authenticationMode).toBe(IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE);
    expect(overview.headerStatusAvailable).toBe(false);
  });

  it("uses not validated yet when no validation probe has run", () => {
    const overview = resolveIdentityProvidersOverview({
      authConfigurationDiagnostics: {
        authMode: "JwtBearer",
        audienceConfigured: true,
        issuerOrAuthorityConfigured: true,
        openIdDiscoverySucceeded: null,
        saml2Enabled: false,
        roleClaimNameConfigured: false,
        tenantClaimMappingConfigured: false,
      },
      authConfigurationDiagnosticsAvailable: true,
      identityProviderDiagnostics: null,
      identityProviderDiagnosticsAvailable: false,
      oidcDiagnostics: {
        authMode: "JwtBearer",
        discoveryAttempted: false,
      },
      oidcDiagnosticsAvailable: true,
    });

    expect(overview.validationStatusLabel).toBe(IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET);
  });
});
