import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/diagnostics",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { IdentityProvidersDiagnosticsPageView } from "./IdentityProvidersDiagnosticsPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING,
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
    note: null,
    rows: [],
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
    refresh: vi.fn(async () => undefined),
    accessDenied: false,
    overview: {
      authenticationModeLabel: "OIDC / JWT",
      usesLocalDevelopmentSignIn: false,
      ssoStatus: "Enabled",
      samlStatus: "Not configured",
      oidcStatus: "Healthy",
      roleMappingStatus: "Configured",
      lastValidationLabel: "Today",
      recommendedNextStep: "Validate role mapping",
      recommendedNextHref: "/administration/identity-providers/role-mapping",
    },
    ...overrides,
  };
}

describe("IdentityProvidersDiagnosticsPageView", () => {
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

  it("prioritizes health and checklist ahead of collapsed protocol diagnostics (TB-1908)", () => {
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
    expect(screen.getByTestId("identity-provider-health-card")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-diagnostics-protocol-details")).toHaveTextContent(
      IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE,
    );
    expect(screen.getByTestId("identity-providers-diagnostics-protocol-details")).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText(IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE));

    expect(screen.getByTestId("identity-providers-diagnostics-protocol-details")).toHaveAttribute("open");
    expect(screen.getByTestId("oidc-diagnostics-card")).toBeInTheDocument();
  });
});
