import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const hoistedIdentityProvidersLoad = vi.hoisted(() => ({ demo: false }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers",
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("./_sections/load-identity-providers-settings-page-data", () => ({
  loadIdentityProvidersSettingsPageData: () => Promise.resolve(hoistedIdentityProvidersLoad),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
  useNavCommittedArchitectureReview: () => false,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 100,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),}));

import IdentityProvidersSettingsPage from "./page";
import { IDENTITY_PROVIDERS_PAGE_TITLE } from "@/lib/identity-providers-settings-copy";

afterEach(() => {
  hoistedIdentityProvidersLoad.demo = false;
  vi.unstubAllGlobals();
});

function stubIdentityProvidersFetch(keys: unknown[], oidcDiagnostics?: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

      if (url.includes("/diagnostics/identity-providers")) {
        return new Response(
          JSON.stringify({
            oidc: { status: "Healthy", summary: "OIDC configured." },
            saml: { status: "NotApplicable", summary: "SAML disabled." },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/auth/configuration-diagnostics")) {
        return new Response(
          JSON.stringify({
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
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/auth/oidc-diagnostics")) {
        return new Response(
          JSON.stringify(
            oidcDiagnostics ?? {
              authMode: "JwtBearer",
              configuredAuthority: "https://login.example.com/",
              configuredAudience: "api://demo",
              discoveryAttempted: true,
              discoverySucceeded: true,
              openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
            },
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/auth/saml-operational-health")) {
        return new Response(JSON.stringify({ saml2Enabled: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/admin/identity/configuration")) {
        return new Response(null, { status: 404 });
      }

      return new Response(JSON.stringify({ keys }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

describe("IdentityProvidersSettingsPage", () => {
  it("renders the buyer-safe overview with summary cards and section navigation", async () => {
    stubIdentityProvidersFetch([
      {
        section: "ArchLucidAuth",
        configPath: "ArchLucidAuth:Authority",
        isSet: true,
        effectiveValue: "https://login.example.com",
      },
    ]);

    const page = await IdentityProvidersSettingsPage();

    render(page);

    expect(await screen.findByRole("heading", { name: IDENTITY_PROVIDERS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByTestId("identity-providers-settings-nav")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-overview-summary")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-primary-next-step-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-overview-links")).toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("saml-sp-configuration-form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-provider-health-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-token-test-mapping-card")).not.toBeInTheDocument();
  });

  it("does not expose DevelopmentBypass on the overview", async () => {
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
          return new Response(JSON.stringify({ oidc: { status: "NotApplicable" }, saml: { status: "NotApplicable" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
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

        return new Response(JSON.stringify({ keys: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const page = await IdentityProvidersSettingsPage();

    render(page);

    expect(await screen.findByTestId("identity-providers-primary-next-step-button")).toBeInTheDocument();
    expect(screen.getAllByText(/Local development sign-in/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/DevelopmentBypass/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-local-dev-notice")).toBeNull();
  });
});
