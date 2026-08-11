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
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
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
});
