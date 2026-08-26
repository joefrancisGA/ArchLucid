import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/role-mapping",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/lib/admin-identity-provider-api", () => ({
  fetchTenantIdentityProviderConfiguration: vi.fn(async () => null),
}));

import { IdentityProvidersRoleMappingPageView } from "./IdentityProvidersRoleMappingPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  BUYER_IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";
import {
  ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID,
  ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL,
} from "./role-mapping-settings-page-copy";

function buildModel(
  overrides: Partial<UseIdentityProvidersSettingsPageModel> = {},
): UseIdentityProvidersSettingsPageModel {
  return {
    identityProviderDiagnostics: null,
    identityProviderDiagnosticsNote: null,
    identityProviderDiagnosticsLoaded: true,
    authConfigurationDiagnostics: {
      authMode: "JwtBearer",
      tenantIdentityProviderProtocol: null,
      roleClaimNameConfigured: true,
      tenantClaimMappingConfigured: true,
      issuerOrAuthorityConfigured: true,
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
      roleMappingStatus: "Enabled",
      validationStatusLabel: "Today",
      tileCaptions: {},
      recommendedNextStep: "Validate role mapping",
      recommendedNextHref: "/administration/identity-providers/diagnostics",
      headerStatusAvailable: true,
    },
    ...overrides,
  };
}

describe("IdentityProvidersRoleMappingPageView buyer-polished shell (ADO)", () => {
  it("renders skip link, breadcrumb, orientation strip, and buyer subtitle", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("identity-providers-settings-primary-content")).toHaveAttribute(
      "id",
      ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("identity-providers-role-mapping-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-role-mapping-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("role-mapping-settings-sources")).toBeInTheDocument();
    expect(screen.getByText(BUYER_IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-role-mapping-tenant-scope")).not.toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-tenant-scope")).toBeInTheDocument();
  });
});
