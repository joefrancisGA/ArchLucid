import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/identity-providers/diagnostics",
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import { IdentityProvidersDiagnosticsPageView } from "./IdentityProvidersDiagnosticsPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING,
  IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE,
  IDENTITY_PROVIDERS_PAGE_INTRO,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";

function buildModel(
  overrides: Partial<UseIdentityProvidersSettingsPageModel> = {},
): UseIdentityProvidersSettingsPageModel {
  return {
    identityProviderDiagnostics: null,
    identityProviderDiagnosticsNote: null,
    identityProviderDiagnosticsLoaded: false,
    authConfigurationDiagnostics: null,
    authConfigurationDiagnosticsNote: null,
    authConfigurationDiagnosticsLoaded: false,
    oidcDiagnostics: null,
    oidcDiagnosticsNote: null,
    oidcDiagnosticsLoaded: false,
    samlOperationalHealth: null,
    samlOperationalHealthNote: null,
    samlOperationalHealthLoaded: false,
    dataLoaded: true,
    refreshing: false,
    lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
    diagnosticsDataUnavailable: false,
    overviewStatusFailure: null,
    refresh: vi.fn(async () => undefined),
    accessDenied: false,
    overview: {
      authenticationModeLabel: "OIDC / JWT",
      usesLocalDevelopmentSignIn: false,
      ssoStatus: "Enabled",
      samlStatus: "Not configured",
      oidcStatus: "Healthy",
      roleMappingStatus: "Configured",
      validationStatusLabel: "Today",
      tileCaptions: {},
      recommendedNextStep: "Validate role mapping",
      recommendedNextHref: "/administration/identity-providers/role-mapping",
      headerStatusAvailable: true,
    },
    ...overrides,
  };
}

describe("IdentityProvidersDiagnosticsPageView", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("uses diagnostics-specific shell subtitle instead of configure workspace intro (TB-1906)", () => {
    render(<IdentityProvidersDiagnosticsPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_PAGE_INTRO)).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-diagnostics-intro")).toBeNull();
  });

  it("shows bundle loading and a single primary lead region while diagnostics are pending (TB-1908, TB-1909)", () => {
    render(<IdentityProvidersDiagnosticsPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-diagnostics-primary-lead")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-diagnostics-loading")).toHaveTextContent(
      IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING,
    );
    expect(screen.queryByTestId("identity-provider-health-card")).toBeNull();
    expect(screen.queryByTestId("identity-providers-diagnostics-protocol-details")).toBeNull();
  });

  it("prioritizes readiness line, checklist, and prominent health ahead of collapsed protocol diagnostics (TB-1908)", () => {
    render(
      <IdentityProvidersDiagnosticsPageView
        model={buildModel({
          identityProviderDiagnosticsLoaded: true,
          identityProviderDiagnostics: {
            oidc: { status: "Healthy", summary: "OIDC configured." },
            saml: { status: "NotApplicable", summary: "SAML disabled." },
          },
          authConfigurationDiagnosticsLoaded: true,
          authConfigurationDiagnostics: {
            authMode: "ApiKey",
            audienceConfigured: true,
            issuerOrAuthorityConfigured: null,
            openIdDiscoverySucceeded: null,
            saml2Enabled: false,
            spEntityIdConfigured: null,
            samlRoleClaimSourcesConfigured: null,
            tenantClaimMappingConfigured: null,
            tenantIdentityProviderProtocol: null,
            jwksConfigured: null,
            scimProvisioningConfigured: null,
            scimBearerTokenActive: null,
            roleClaimNameConfigured: true,
            misconfigurationHints: [],
          },
          oidcDiagnosticsLoaded: true,
          oidcDiagnostics: {
            authMode: "JwtBearer",
            configuredAuthority: "https://login.example.com/",
            configuredAudience: "api://demo",
            discoveryAttempted: true,
            discoverySucceeded: true,
            openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
          },
          samlOperationalHealthLoaded: true,
          samlOperationalHealth: { saml2Enabled: false },
        })}
      />,
    );

    expect(screen.queryByTestId("identity-providers-diagnostics-loading")).toBeNull();
    const readinessLine = screen.getByTestId("identity-providers-diagnostics-readiness-line");
    const checklist = screen.getByTestId("identity-provider-setup-checklist");
    const healthCard = screen.getByTestId("identity-provider-health-card");
    const protocolDetails = screen.getByTestId("identity-providers-diagnostics-protocol-details");

    expect(readinessLine.compareDocumentPosition(checklist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(checklist.compareDocumentPosition(healthCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(protocolDetails).not.toContainElement(healthCard);
    expect(protocolDetails).toHaveTextContent(IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE);
    expect(protocolDetails).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText(IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE));

    expect(protocolDetails).toHaveAttribute("open");
    expect(screen.getByTestId("oidc-diagnostics-card")).toBeInTheDocument();
  });

  it("collapses both-not-applicable health probes into protocol diagnostics", () => {
    render(
      <IdentityProvidersDiagnosticsPageView
        model={buildModel({
          identityProviderDiagnosticsLoaded: true,
          identityProviderDiagnostics: {
            oidc: { status: "NotApplicable", summary: "OIDC not in use." },
            saml: { status: "NotApplicable", summary: "SAML not in use." },
          },
          authConfigurationDiagnosticsLoaded: true,
          authConfigurationDiagnostics: {
            authMode: "ApiKey",
            audienceConfigured: true,
            issuerOrAuthorityConfigured: null,
            openIdDiscoverySucceeded: null,
            saml2Enabled: false,
            spEntityIdConfigured: null,
            samlRoleClaimSourcesConfigured: null,
            tenantClaimMappingConfigured: null,
            tenantIdentityProviderProtocol: null,
            jwksConfigured: null,
            scimProvisioningConfigured: null,
            scimBearerTokenActive: null,
            roleClaimNameConfigured: true,
            misconfigurationHints: [],
          },
          oidcDiagnosticsLoaded: true,
          oidcDiagnostics: { authMode: "ApiKey" },
          samlOperationalHealthLoaded: true,
          samlOperationalHealth: { saml2Enabled: false },
        })}
      />,
    );

    const protocolDetails = screen.getByTestId("identity-providers-diagnostics-protocol-details");
    const healthCard = screen.getByTestId("identity-provider-health-card");

    expect(protocolDetails).toContainElement(healthCard);
  });

  it("opens protocol diagnostics for the OIDC deep link after the payloads settle", () => {
    window.location.hash = `#${IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID}`;

    const { rerender } = render(<IdentityProvidersDiagnosticsPageView model={buildModel()} />);

    expect(screen.queryByTestId("identity-providers-diagnostics-protocol-details")).toBeNull();

    rerender(
      <IdentityProvidersDiagnosticsPageView
        model={buildModel({
          oidcDiagnosticsLoaded: true,
          oidcDiagnostics: { authMode: "JwtBearer" },
          samlOperationalHealthLoaded: true,
          samlOperationalHealth: { saml2Enabled: false },
        })}
      />,
    );

    expect(screen.getByTestId("identity-providers-diagnostics-protocol-details")).toHaveAttribute("open");
  });
});
