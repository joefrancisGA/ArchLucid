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

import { useIdentityProvidersSettingsPage } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
} from "@/lib/identity-providers-settings-copy";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useIdentityProvidersSettingsPage", () => {
  it("recommends SSO wizard for DevelopmentBypass after diagnostics load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

        if (url.includes("/auth/configuration-diagnostics")) {
          return new Response(
            JSON.stringify({
              authMode: "DevelopmentBypass",
              audienceConfigured: false,
              issuerOrAuthorityConfigured: false,
              openIdDiscoverySucceeded: null,
              saml2Enabled: false,
              roleClaimNameConfigured: false,
              tenantClaimMappingConfigured: false,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        if (url.includes("/diagnostics/identity-providers")) {
          return new Response(
            JSON.stringify({ oidc: { status: "Healthy" }, saml: { status: "NotApplicable" } }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        if (url.includes("/auth/oidc-diagnostics")) {
          return new Response(JSON.stringify({ authMode: "DevelopmentBypass" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.includes("/auth/saml-operational-health")) {
          return new Response(JSON.stringify({ saml2Enabled: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(null, { status: 404 });
      }),
    );

    const { result } = renderHook(() => useIdentityProvidersSettingsPage({ demo: false }));

    await waitFor(() => {
      expect(result.current.dataLoaded).toBe(true);
    });

    expect(result.current.overviewStatusFailure).toBeNull();
    expect(result.current.overview.recommendedNextHref).toBe(IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF);
  });
});
