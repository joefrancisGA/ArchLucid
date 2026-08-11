import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/oidc",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { IdentityProvidersOidcPageView } from "./IdentityProvidersOidcPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS,
  IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY,
  IDENTITY_PROVIDERS_OIDC_EMPTY,
  IDENTITY_PROVIDERS_OIDC_LOADING,
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
} from "@/lib/identity-providers-settings-copy";

function buildModel(
  overrides: Partial<UseIdentityProvidersSettingsPageModel> = {},
): UseIdentityProvidersSettingsPageModel {
  return {
    note: null,
    rows: [],
    identityProviderDiagnostics: null,
    identityProviderDiagnosticsNote: null,
    identityProviderDiagnosticsLoaded: true,
    authConfigurationDiagnostics: null,
    authConfigurationDiagnosticsNote: null,
    authConfigurationDiagnosticsLoaded: true,
    oidcDiagnostics: {
      authMode: "JwtBearer",
      configuredAuthority: "https://login.example.com/",
      configuredAudience: "api://demo",
      discoveryAttempted: true,
      discoverySucceeded: true,
      openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
    },
    oidcDiagnosticsNote: null,
    oidcDiagnosticsLoaded: true,
    samlOperationalHealth: null,
    samlOperationalHealthNote: null,
    samlOperationalHealthLoaded: true,
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

describe("IdentityProvidersOidcPageView", () => {
  it("uses status framing for shell H1 instead of configuration overclaim (TB-1911)", () => {
    render(<IdentityProvidersOidcPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_OIDC_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /OIDC\/JWT configuration/i })).toBeNull();
  });

  it("uses OIDC-specific shell subtitle instead of generic configure intro (TB-1912)", () => {
    render(<IdentityProvidersOidcPageView model={buildModel()} />);

    expect(screen.getByText(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_PAGE_SUBTITLE)).not.toBeInTheDocument();
  });

  it("renders discovery status with StatusTag and human label (TB-1913)", () => {
    render(<IdentityProvidersOidcPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-oidc-discovery-status")).toHaveTextContent(
      IDENTITY_PROVIDERS_STATUS_HEALTHY,
    );
  });

  it("shows loading state until OIDC diagnostics load (TB-1914)", () => {
    render(
      <IdentityProvidersOidcPageView
        model={buildModel({ oidcDiagnosticsLoaded: false, oidcDiagnostics: null })}
      />,
    );

    expect(screen.getByTestId("identity-providers-oidc-loading")).toHaveTextContent(
      IDENTITY_PROVIDERS_OIDC_LOADING,
    );
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("shows empty state instead of em-dashes when OIDC payload is missing (TB-1914)", () => {
    render(<IdentityProvidersOidcPageView model={buildModel({ oidcDiagnostics: null })} />);

    expect(screen.getByTestId("identity-providers-oidc-empty")).toHaveTextContent(
      IDENTITY_PROVIDERS_OIDC_EMPTY,
    );
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("uses SSO wizard as primary CTA when discovery is healthy (TB-1914)", () => {
    render(<IdentityProvidersOidcPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-oidc-primary-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
    );
    expect(screen.getByTestId("identity-providers-oidc-secondary-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS,
    );
  });

  it("uses diagnostics as primary CTA when discovery needs review (TB-1914)", () => {
    render(
      <IdentityProvidersOidcPageView
        model={buildModel({
          oidcDiagnostics: {
            authMode: "JwtBearer",
            configuredAuthority: "https://login.example.com/",
            configuredAudience: "api://demo",
            discoveryAttempted: true,
            discoverySucceeded: false,
          },
          overview: {
            ...buildModel().overview,
            oidcStatus: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
          },
        })}
      />,
    );

    expect(screen.getByTestId("identity-providers-oidc-primary-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY,
    );
    expect(screen.getByTestId("identity-providers-oidc-secondary-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
    );
  });
});
