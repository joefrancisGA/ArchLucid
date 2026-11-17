import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/app/(operator)/administration/users/_sections/AuthBetaReadinessInviteCallout", () => ({
  AuthBetaReadinessInviteCallout: () => null,
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
import { IdentityProvidersSettingsProvider } from "./_sections/IdentityProvidersSettingsProvider";
import { IDENTITY_PROVIDERS_PAGE_TITLE, IDENTITY_PROVIDERS_RESTRICTED_TITLE } from "@/lib/identity-providers-settings-copy";

function renderIdentityProvidersSettingsPage(): void {
  render(
    <IdentityProvidersSettingsProvider loaded={hoistedIdentityProvidersLoad}>
      <IdentityProvidersSettingsPage />
    </IdentityProvidersSettingsProvider>,
  );
}

afterEach(() => {
  hoistedIdentityProvidersLoad.demo = false;
  vi.unstubAllGlobals();
});

const IDENTITY_PROVIDERS_PAGE_BUNDLE_URL =
  "/api/proxy/v1/admin/diagnostics/identity-providers-page-bundle";

function requestedFetchUrl(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof Request) {
    return input.url;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return String(input);
}

function buildIdentityProvidersPageBundle(authMode: "JwtBearer" | "DevelopmentBypass"): unknown {
  return {
    identityProviderDiagnostics: {
      oidc: { status: "Healthy", summary: "OIDC configured." },
      saml: { status: "NotApplicable", summary: "SAML disabled." },
    },
    authConfigurationDiagnostics: {
      authMode,
      audienceConfigured: authMode !== "DevelopmentBypass",
      issuerOrAuthorityConfigured: authMode !== "DevelopmentBypass",
      openIdDiscoverySucceeded: authMode !== "DevelopmentBypass" ? true : null,
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
    },
    oidcDiagnostics:
      authMode === "DevelopmentBypass"
        ? { authMode: "DevelopmentBypass" }
        : {
            authMode: "JwtBearer",
            configuredAuthority: "https://login.example.com/",
            configuredAudience: "api://demo",
            discoveryAttempted: true,
            discoverySucceeded: true,
            openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
          },
    samlOperationalHealth: { saml2Enabled: false },
  };
}

function stubIdentityProvidersFetch(options?: {
  readonly bundleStatus?: number;
  readonly authMode?: "JwtBearer" | "DevelopmentBypass";
}): ReturnType<typeof vi.fn> {
  const authMode = options?.authMode ?? "JwtBearer";

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

    if (url.includes("identity-providers-page-bundle")) {
      return new Response(JSON.stringify(buildIdentityProvidersPageBundle(authMode)), {
        status: options?.bundleStatus ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.includes("/internal/configuration/summary")) {
      throw new Error(`Unexpected configuration summary request: ${url}`);
    }

    return new Response(null, { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

describe("IdentityProvidersSettingsPage", () => {
  it("issues the identity providers page bundle request and no configuration summary request", async () => {
    const fetchMock = stubIdentityProvidersFetch();

    renderIdentityProvidersSettingsPage();

    await waitFor(() => {
      expect(screen.getByTestId("identity-providers-overview-summary")).toBeInTheDocument();
    });

    const requestedUrls = fetchMock.mock.calls.map((call) => requestedFetchUrl(call[0]));

    const bundleRequests = requestedUrls.filter((requested) =>
      requested.includes("identity-providers-page-bundle"),
    );

    expect(bundleRequests.length).toBeGreaterThan(0);
    expect(bundleRequests.some((requested) => requested.includes(IDENTITY_PROVIDERS_PAGE_BUNDLE_URL))).toBe(
      true,
    );
    expect(requestedUrls.some((requested) => requested.includes("/internal/configuration/summary"))).toBe(false);
  });

  it("renders the buyer-safe overview with summary cards and section navigation", async () => {
    stubIdentityProvidersFetch();

    renderIdentityProvidersSettingsPage();

    expect(await screen.findByRole("heading", { name: IDENTITY_PROVIDERS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-last-refreshed")).toHaveTextContent(/Last refreshed:/i);
    expect(screen.getByTestId("identity-providers-settings-nav")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-overview-summary")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-primary-next-step-button")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-sign-in-domains-link")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-admin-fallback-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-overview-links")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("saml-sp-configuration-form")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-provider-health-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-token-test-mapping-card")).not.toBeInTheDocument();
  });

  it("renders restricted state when the page bundle returns 403", async () => {
    stubIdentityProvidersFetch({ bundleStatus: 403 });

    renderIdentityProvidersSettingsPage();

    expect(await screen.findByTestId("identity-providers-settings-restricted")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_RESTRICTED_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-overview-summary")).not.toBeInTheDocument();
  });

  it("does not expose DevelopmentBypass on the overview", async () => {
    const fetchMock = stubIdentityProvidersFetch({ authMode: "DevelopmentBypass" });

    renderIdentityProvidersSettingsPage();

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Local development sign-in/i).length).toBeGreaterThan(0);
    });
    expect(screen.queryByTestId("identity-providers-overview-status-failure")).toBeNull();
    expect(screen.getByTestId("identity-providers-sso-setup-cta-button")).toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-primary-next-step-button")).toBeNull();
    expect(screen.queryByText(/DevelopmentBypass/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-local-dev-notice")).toBeNull();
  });
});
