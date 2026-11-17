import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/fetch-identity-providers-page-bundle-client", () => ({
  fetchIdentityProvidersPageBundle: vi.fn(),
}));

import { useIdentityProvidersSettingsPage } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
} from "@/lib/identity-providers-settings-copy";
import { fetchIdentityProvidersPageBundle } from "@/lib/fetch-identity-providers-page-bundle-client";

const mockFetchIdentityProvidersPageBundle = vi.mocked(fetchIdentityProvidersPageBundle);

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetchIdentityProvidersPageBundle.mockReset();
});

describe("useIdentityProvidersSettingsPage", () => {
  it("recommends SSO wizard for DevelopmentBypass after diagnostics load", async () => {
    mockFetchIdentityProvidersPageBundle.mockResolvedValue({
      authConfigurationDiagnostics: {
        authMode: "DevelopmentBypass",
        audienceConfigured: false,
        issuerOrAuthorityConfigured: false,
        openIdDiscoverySucceeded: null,
        saml2Enabled: false,
        roleClaimNameConfigured: false,
        tenantClaimMappingConfigured: false,
      },
      identityProviderDiagnostics: {
        oidc: { status: "Healthy" },
        saml: { status: "NotApplicable" },
      },
      oidcDiagnostics: { authMode: "DevelopmentBypass" },
      samlOperationalHealth: { saml2Enabled: false },
    });

    const { result } = renderHook(() => useIdentityProvidersSettingsPage({ demo: false }));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.overviewStatusFailure).toBeNull();
    expect(result.current.overview.recommendedNextHref).toBe(IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF);
  });
});
