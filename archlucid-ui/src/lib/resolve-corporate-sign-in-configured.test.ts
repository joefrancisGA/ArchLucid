import { describe, expect, it } from "vitest";

import { resolveCorporateSignInConfigured } from "@/lib/resolve-corporate-sign-in-configured";
import type { ResolveIdentityProvidersOverviewInput } from "@/lib/resolve-identity-providers-overview";

const OIDC_HEALTHY_IDENTITY: ResolveIdentityProvidersOverviewInput = {
  authConfigurationDiagnostics: {
    authMode: "JwtBearer",
    saml2Enabled: false,
    tenantIdentityProviderProtocol: "Oidc",
    roleClaimNameConfigured: true,
    tenantClaimMappingConfigured: true,
  },
  authConfigurationDiagnosticsAvailable: true,
  identityProviderDiagnostics: null,
  identityProviderDiagnosticsAvailable: false,
  oidcDiagnostics: {
    discoverySucceeded: true,
  },
  oidcDiagnosticsAvailable: true,
};

describe("resolveCorporateSignInConfigured", () => {
  it("returns true when OIDC diagnostics are healthy", () => {
    expect(resolveCorporateSignInConfigured(OIDC_HEALTHY_IDENTITY, false)).toBe(true);
  });

  it("returns false when development bypass is active", () => {
    expect(
      resolveCorporateSignInConfigured(
        {
          authConfigurationDiagnostics: {
            authMode: "DevelopmentBypass",
            saml2Enabled: false,
            tenantIdentityProviderProtocol: null,
            roleClaimNameConfigured: false,
            tenantClaimMappingConfigured: false,
          },
          authConfigurationDiagnosticsAvailable: true,
          identityProviderDiagnostics: null,
          identityProviderDiagnosticsAvailable: false,
          oidcDiagnostics: null,
          oidcDiagnosticsAvailable: false,
        },
        false,
      ),
    ).toBe(false);
  });

  it("returns null when identity diagnostics failed to load", () => {
    expect(resolveCorporateSignInConfigured(null, true)).toBeNull();
    expect(resolveCorporateSignInConfigured(null, false)).toBeNull();
  });
});
