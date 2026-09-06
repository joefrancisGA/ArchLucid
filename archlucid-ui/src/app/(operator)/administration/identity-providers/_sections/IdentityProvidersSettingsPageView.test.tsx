import { fireEvent, render, screen, within } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/identity-providers",
  });
});



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

  IDENTITY_PROVIDERS_OVERVIEW_SIGN_IN_STATUS_TITLE,

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

  it("renders claim-discipline orientation strip on the live hub page", () => {
    render(<IdentityProvidersSettingsPageView model={buildModel()} />);

    expect(screen.queryByTestId("identity-providers-settings-claim-discipline")).not.toBeInTheDocument();
  });

  it("keeps SSO setup as the sole primary when a recommended next step is also shown", () => {
    render(<IdentityProvidersSettingsPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-sso-setup-cta-button")).toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );
    expect(screen.getByTestId("identity-providers-primary-next-step-button")).toHaveClass(
      "border-neutral-300",
    );
    expect(screen.getByTestId("identity-providers-primary-next-step-button")).not.toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );
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

    expect(screen.queryByTestId("identity-providers-primary-next-step-button")).toBeNull();

    expect(screen.getByTestId("identity-providers-admin-fallback-notice")).toBeInTheDocument();



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

            recommendedNextHref: null,

            headerStatusAvailable: false,

          },

        })}

      />,

    );



    expect(screen.getAllByLabelText(/^Status: Unknown$/i)).toHaveLength(5);

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



    expect(screen.getByTestId("identity-providers-sso-setup-cta-button")).toHaveAttribute(
      "href",
      IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
    );

    expect(screen.getByTestId("identity-providers-sso-setup-cta-button")).toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );

    expect(screen.queryByTestId("identity-providers-primary-next-step-button")).toBeNull();

    expect(screen.queryByTestId("identity-providers-recommended-next-card")).toBeNull();

    expect(screen.queryByTestId("identity-providers-local-dev-notice")).toBeNull();

    expect(screen.getByTestId("identity-providers-admin-fallback-notice")).toHaveTextContent(

      /Keep at least one workspace administrator account/i,

    );

  });



  it("names the sign-in status region and uses definition list tiles", () => {

    render(<IdentityProvidersSettingsPageView model={buildModel()} />);



    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_OVERVIEW_SIGN_IN_STATUS_TITLE })).toBeInTheDocument();



    const summary = screen.getByTestId("identity-providers-overview-summary");



    expect(summary).toHaveAttribute("aria-labelledby", "identity-providers-sign-in-status-heading");

    expect(within(summary).getAllByRole("term")).toHaveLength(6);

    expect(within(summary).getAllByRole("definition").length).toBeGreaterThanOrEqual(6);

  });



  it("renders status tiles with StatusTag and term links without duplicating tab destinations", () => {

    render(<IdentityProvidersSettingsPageView model={buildModel()} />);

    const summary = screen.getByTestId("identity-providers-overview-summary");

    expect(within(screen.getByTestId("identity-providers-overview-tile-sso")).getByLabelText("Status: Enabled")).toBeInTheDocument();

    expect(within(screen.getByTestId("identity-providers-overview-tile-oidc")).getByLabelText("Status: Healthy")).toBeInTheDocument();

    expect(within(screen.getByTestId("identity-providers-overview-tile-role-mapping")).getByLabelText("Status: Enabled")).toBeInTheDocument();

    expect(within(summary).queryByText("Enabled", { selector: ".font-semibold" })).toBeNull();



    expect(within(screen.getByTestId("identity-providers-overview-tile-saml")).getByRole("link", { name: "SAML" })).toHaveAttribute(

      "href",

      "/administration/identity-providers/saml",

    );

    expect(within(screen.getByTestId("identity-providers-overview-tile-oidc")).getByRole("link", { name: "OIDC/JWT" })).toHaveAttribute(

      "href",

      "/administration/identity-providers/oidc",

    );

    expect(within(screen.getByTestId("identity-providers-overview-tile-role-mapping")).getByRole("link", { name: "Role mapping" })).toHaveAttribute(

      "href",

      "/administration/identity-providers/role-mapping",

    );

    expect(within(screen.getByTestId("identity-providers-overview-tile-validation")).getByRole("link", { name: "Validation status" })).toHaveAttribute(

      "href",

      "/administration/identity-providers/diagnostics",

    );

    expect(screen.queryByRole("link", { name: "Single sign-on" })).toBeNull();



    expect(screen.queryByTestId("identity-providers-overview-links")).toBeNull();

    expect(screen.getByTestId("identity-providers-sign-in-domains-link").querySelector("a")).toHaveAttribute(

      "href",

      "/administration/auth-domains",

    );



    const navHrefs = Array.from(screen.getByTestId("identity-providers-settings-nav").querySelectorAll("a")).map(

      (anchor) => anchor.getAttribute("href"),

    );



    expect(navHrefs).not.toContain("/administration/auth-domains");

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

