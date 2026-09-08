import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/identity-providers/role-mapping",
  });
});

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
  ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE,
  ROLE_MAPPING_SETTINGS_SOURCES,
} from "@/lib/role-mapping-settings-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  ROLE_MAPPING_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID,
  ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL,
  ROLE_MAPPING_SETTINGS_SKIP_TARGET_ID,
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
  it("renders skip link, first-viewport band, orientation above status card, and buyer subtitle", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: ROLE_MAPPING_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ROLE_MAPPING_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("identity-providers-settings-primary-content")).toHaveAttribute(
      "id",
      ROLE_MAPPING_SETTINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("identity-providers-role-mapping-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByText(BUYER_IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-role-mapping-tenant-scope")).not.toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-tenant-scope")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ROLE_MAPPING_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("identity-providers-settings-primary-content");
    const firstViewport = screen.getByTestId(ROLE_MAPPING_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("identity-providers-role-mapping-orientation-top");
    const statusCard = screen.getByTestId("identity-providers-role-mapping-status");
    const sourcesSection = screen.getByTestId("role-mapping-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(statusCard);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(statusCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ROLE_MAPPING_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
