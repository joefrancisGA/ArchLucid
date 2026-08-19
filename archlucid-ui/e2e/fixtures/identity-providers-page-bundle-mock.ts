/** Canonical mock for `GET /v1/admin/diagnostics/identity-providers-page-bundle` in Playwright suites. */
export function getIdentityProvidersPageBundleMockJson(): unknown {
  return {
    identityProviderDiagnostics: {
      oidc: { status: "Healthy", summary: "OIDC configured." },
      saml: { status: "NotApplicable", summary: "SAML disabled." },
    },
    authConfigurationDiagnostics: {
      authMode: "JwtBearer",
      audienceConfigured: true,
      issuerOrAuthorityConfigured: true,
      openIdDiscoverySucceeded: true,
      saml2Enabled: false,
      spEntityIdConfigured: null,
      samlRoleClaimSourcesConfigured: null,
      tenantClaimMappingConfigured: false,
      tenantIdentityProviderProtocol: null,
      jwksConfigured: true,
      scimProvisioningConfigured: null,
      scimBearerTokenActive: null,
      roleClaimNameConfigured: false,
      misconfigurationHints: [],
      operatorBaseUrlConfigured: true,
      localTrialIdentityConfigured: false,
    },
    oidcDiagnostics: {
      authMode: "JwtBearer",
      configuredAuthority: "https://login.example.com/",
      configuredAudience: "api://demo",
      discoveryAttempted: true,
      discoverySucceeded: true,
      openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
    },
    samlOperationalHealth: {
      saml2Enabled: false,
      status: "NotApplicable",
    },
  };
}
