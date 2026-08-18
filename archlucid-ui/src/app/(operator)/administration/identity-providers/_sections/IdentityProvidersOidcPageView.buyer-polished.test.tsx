import { render, screen } from "@testing-library/react";
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
  OIDC_SETTINGS_PRIMARY_CONTENT_ID,
  OIDC_SETTINGS_SKIP_LINK_LABEL,
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
  it("renders skip link, breadcrumb, orientation strip, and buyer subtitle", () => {
    render(<IdentityProvidersOidcPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: OIDC_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OIDC_SETTINGS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("identity-providers-settings-primary-content")).toHaveAttribute(
      "id",
      OIDC_SETTINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("identity-providers-oidc-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-oidc-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-oidc-settings-sources")).toBeInTheDocument();
    expect(screen.getByText(BUYER_IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("identity-providers-settings-primary-content");
    const orderedLandmarks = ["identity-providers-oidc-orientation-top", "identity-providers-oidc-status-card"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["identity-providers-oidc-orientation-top", "identity-providers-oidc-status-card"]);
  });
});
