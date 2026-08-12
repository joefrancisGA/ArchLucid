import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers",
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import { IdentityProvidersSettingsPageView } from "./IdentityProvidersSettingsPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_CONFIG_SUMMARY_LOAD_ERROR_NOTE,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
  IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
  IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
  IDENTITY_PROVIDERS_STATUS_UNKNOWN,
} from "@/lib/identity-providers-settings-copy";
import { AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE } from "@/lib/vocabulary/auth-domains-identity-providers-vocabulary";
import { IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE } from "@/lib/vocabulary/identity-providers-sso-wizard-vocabulary";
import { SCIM_IDENTITY_PROVIDERS_COMPACT_LINE } from "@/lib/vocabulary/scim-identity-providers-vocabulary";

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

describe("IdentityProvidersSettingsPageView", () => {
  it("does not surface configuration-summary failures on the overview", () => {
    render(
      <IdentityProvidersSettingsPageView
        model={buildModel({
          note: `${IDENTITY_PROVIDERS_CONFIG_SUMMARY_LOAD_ERROR_NOTE} (HTTP 404).`,
        })}
      />,
    );

    expect(screen.queryByTestId("identity-providers-note")).toBeNull();
    expect(screen.queryByText(/HTTP 404/i)).toBeNull();
    expect(screen.getByTestId("identity-providers-overview-summary")).toBeInTheDocument();
  });

  it("shows a retryable overview failure only when status probes are unavailable", () => {
    const refresh = vi.fn(async () => undefined);

    render(
      <IdentityProvidersSettingsPageView
        model={buildModel({
          diagnosticsDataUnavailable: true,
          overviewStatusFailure: {
            message: IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
            statusCode: 503,
          },
          refresh,
        })}
      />,
    );

    expect(screen.getByTestId("identity-providers-overview-status-failure")).toBeInTheDocument();
    expect(screen.getByText(/HTTP status: 503/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("identity-providers-overview-status-retry-button"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders Unknown tiles with source-unavailable captions on partial probe failure", () => {
    render(
      <IdentityProvidersSettingsPageView
        model={buildModel({
          overview: {
            authenticationModeLabel: IDENTITY_PROVIDERS_STATUS_UNKNOWN,
            usesLocalDevelopmentSignIn: false,
            ssoStatus: IDENTITY_PROVIDERS_STATUS_UNKNOWN,
            samlStatus: IDENTITY_PROVIDERS_STATUS_UNKNOWN,
            oidcStatus: IDENTITY_PROVIDERS_STATUS_UNKNOWN,
            roleMappingStatus: IDENTITY_PROVIDERS_STATUS_UNKNOWN,
            validationStatusLabel: IDENTITY_PROVIDERS_STATUS_UNKNOWN,
            tileCaptions: {
              authenticationMode: IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
              sso: IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
              saml: IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
              oidc: IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
              roleMapping: IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
              validation: IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
            },
            recommendedNextStep: "Configure SAML metadata",
            recommendedNextHref: "/administration/identity-providers/saml",
            headerStatusAvailable: false,
          },
        })}
      />,
    );

    expect(screen.getAllByText(IDENTITY_PROVIDERS_STATUS_UNKNOWN)).toHaveLength(6);
    expect(screen.getAllByText(IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE).length).toBeGreaterThan(0);
  });

  it("renders a single primary next-step button to a configuration surface", () => {
    render(
      <IdentityProvidersSettingsPageView
        model={buildModel({
          overview: {
            authenticationModeLabel: "Local development sign-in",
            usesLocalDevelopmentSignIn: true,
            ssoStatus: "Not configured",
            samlStatus: "Not configured",
            oidcStatus: "Not configured",
            roleMappingStatus: "Not applicable",
            validationStatusLabel: "Not validated yet",
            tileCaptions: {
              roleMapping: IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON,
            },
            recommendedNextStep: IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
            recommendedNextHref: IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
            headerStatusAvailable: true,
          },
        })}
      />,
    );

    expect(screen.getByTestId("identity-providers-primary-next-step-button")).toHaveAttribute(
      "href",
      IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
    );
    expect(screen.queryByTestId("identity-providers-recommended-next-card")).toBeNull();
    expect(screen.queryByTestId("identity-providers-local-dev-notice")).toBeNull();
    expect(screen.getByText(/does not change how anyone signs in today/i)).toBeInTheDocument();
  });

  it("keeps vocabulary rails inside the related-surfaces disclosure below primary content", () => {
    render(<IdentityProvidersSettingsPageView model={buildModel()} />);

    const disclosure = screen.getByTestId("identity-providers-related-surfaces-disclosure");
    const shell = screen.getByTestId("identity-providers-settings-shell");
    const summary = screen.getByTestId("identity-providers-overview-summary");

    expect(shell.contains(disclosure)).toBe(true);
    expect(summary.compareDocumentPosition(disclosure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("identity-providers-sso-wizard-vocabulary")).toBeInTheDocument();
    expect(screen.getByTestId("scim-identity-providers-vocabulary")).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-identity-providers-vocabulary")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-sso-wizard-vocabulary").textContent).toContain(
      IDENTITY_PROVIDERS_SSO_WIZARD_COMPACT_LINE,
    );
    expect(screen.getByTestId("scim-identity-providers-vocabulary").textContent).toContain(
      SCIM_IDENTITY_PROVIDERS_COMPACT_LINE,
    );
    expect(screen.getByTestId("auth-domains-identity-providers-vocabulary").textContent).toContain(
      AUTH_DOMAINS_IDENTITY_PROVIDERS_COMPACT_LINE,
    );
  });
});
