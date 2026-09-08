import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/oidc",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => false,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    workspaceLabel: "Claims Intake Demo",
    tenantId: "tenant-1",
    projectLabel: "Default",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { IdentityProvidersOidcPageView } from "./IdentityProvidersOidcPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  BUYER_IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";
import {
  IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES,
} from "@/lib/identity-providers-oidc-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  OIDC_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  OIDC_SETTINGS_PRIMARY_CONTENT_ID,
  OIDC_SETTINGS_SKIP_LINK_LABEL,
  OIDC_SETTINGS_SKIP_TARGET_ID,
} from "./oidc-settings-page-copy";

function buildModel(
  overrides: Partial<UseIdentityProvidersSettingsPageModel> = {},
): UseIdentityProvidersSettingsPageModel {
  return {
    identityProviderDiagnostics: null,
    identityProviderDiagnosticsNote: null,
    identityProviderDiagnosticsLoaded: true,
    authConfigurationDiagnostics: {
      authMode: "JwtBearer",
      operatorBaseUrlConfigured: true,
      localTrialIdentityConfigured: true,
      openIdDiscoverySucceeded: true,
      audienceConfigured: true,
      roleClaimNameConfigured: true,
      saml2Enabled: false,
      tenantIdentityProviderProtocol: "Oidc",
      tenantClaimMappingConfigured: true,
    },
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
      recommendedNextHref: "/administration/identity-providers/role-mapping",
      headerStatusAvailable: true,
    },
    ...overrides,
  };
}

describe("IdentityProvidersOidcPageView buyer-polished shell (AOI)", () => {
  it("renders skip link, first-viewport band, orientation above status card, and buyer subtitle", () => {
    render(<IdentityProvidersOidcPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: OIDC_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OIDC_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("identity-providers-settings-primary-content")).toHaveAttribute(
      "id",
      OIDC_SETTINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("identity-providers-oidc-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByText(BUYER_IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: IDENTITY_PROVIDERS_OIDC_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("identity-providers-settings-primary-content");
    const firstViewport = screen.getByTestId(OIDC_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("identity-providers-oidc-orientation-top");
    const statusCard = screen.getByTestId("identity-providers-oidc-status-card");
    const sourcesSection = screen.getByTestId("identity-providers-oidc-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(statusCard);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(statusCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(IDENTITY_PROVIDERS_OIDC_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
