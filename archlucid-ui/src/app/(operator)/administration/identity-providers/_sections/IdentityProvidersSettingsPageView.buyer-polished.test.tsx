import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers",
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

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Contoso",
    projectLabel: "Pilot",
  }),
}));

import { IdentityProvidersSettingsPageView } from "./IdentityProvidersSettingsPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";
import {
  IDENTITY_PROVIDERS_SETTINGS_CLAIM_DISCIPLINE,
  IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_SETTINGS_SOURCES,
} from "@/lib/identity-providers-settings-evidence-copy";
import {
  IDENTITY_PROVIDERS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  IDENTITY_PROVIDERS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  IDENTITY_PROVIDERS_SETTINGS_PRIMARY_CONTENT_ID,
  IDENTITY_PROVIDERS_SETTINGS_SKIP_LINK_LABEL,
  IDENTITY_PROVIDERS_SETTINGS_SKIP_TARGET_ID,
} from "./identity-providers-settings-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function buildModel(
  overrides: Partial<UseIdentityProvidersSettingsPageModel> = {},
): UseIdentityProvidersSettingsPageModel {
  return {
    identityProviderDiagnostics: null,
    identityProviderDiagnosticsNote: null,
    identityProviderDiagnosticsLoaded: true,
    authConfigurationDiagnostics: null,
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
      validationStatusLabel: "Healthy",
      tileCaptions: {},
      recommendedNextStep: "Validate role mapping",
      recommendedNextHref: "/administration/identity-providers/role-mapping",
      headerStatusAvailable: true,
    },
    ...overrides,
  };
}

describe("IdentityProvidersSettingsPageView buyer-polished shell (AID)", () => {
  it("renders skip link, start-here panel before follow-ups, header claim discipline, and hides operator chrome", () => {
    render(<IdentityProvidersSettingsPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: IDENTITY_PROVIDERS_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${IDENTITY_PROVIDERS_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(IDENTITY_PROVIDERS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      IDENTITY_PROVIDERS_SETTINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("identity-providers-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-related-surfaces-disclosure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-admin-fallback-notice")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: IDENTITY_PROVIDERS_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-refresh-button")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(IDENTITY_PROVIDERS_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(IDENTITY_PROVIDERS_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("identity-providers-action-panel");
    const orientationBottom = screen.getByTestId("identity-providers-orientation-bottom");
    const sourcesSection = screen.getByTestId("identity-providers-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(actionPanel);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("identity-providers-sso-setup-cta-button")).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(IDENTITY_PROVIDERS_SETTINGS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
