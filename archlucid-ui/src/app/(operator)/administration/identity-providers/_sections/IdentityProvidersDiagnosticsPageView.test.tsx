import { render, screen } from "@testing-library/react";
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
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE,
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
});
