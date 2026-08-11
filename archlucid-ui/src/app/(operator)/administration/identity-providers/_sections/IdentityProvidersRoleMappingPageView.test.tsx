import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/role-mapping",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { IdentityProvidersRoleMappingPageView } from "./IdentityProvidersRoleMappingPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL,
  IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
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
    authConfigurationDiagnostics: {
      authMode: "JwtBearer",
      tenantIdentityProviderProtocol: null,
      roleClaimNameConfigured: true,
    },
    authConfigurationDiagnosticsNote: null,
    authConfigurationDiagnosticsLoaded: true,
    oidcDiagnostics: null,
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
      roleMappingStatus: "Enabled",
      lastValidationLabel: "Today",
      recommendedNextStep: "Validate role mapping",
      recommendedNextHref: "/administration/identity-providers/diagnostics",
    },
    ...overrides,
  };
}

describe("IdentityProvidersRoleMappingPageView", () => {
  it("uses status-hub framing for shell H1 instead of in-page editor overclaim (TB-1916)", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Role mapping$/i })).toBeNull();
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE.toLowerCase()).toContain("review");
  });

  it("uses role-mapping shell subtitle and drops duplicate in-card helper essay (TB-1917)", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByText(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER)).not.toBeInTheDocument();
  });

  it("renders mapping status with StatusTag and illustrative example label (TB-1918)", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-role-mapping-status-tag")).toHaveTextContent(
      IDENTITY_PROVIDERS_STATUS_ENABLED,
    );
    expect(screen.getByText(IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-role-mapping-examples")).toBeInTheDocument();
  });
});
