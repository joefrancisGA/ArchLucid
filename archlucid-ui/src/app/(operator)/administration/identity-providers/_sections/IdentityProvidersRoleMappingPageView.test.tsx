import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/role-mapping",
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

vi.mock("@/lib/admin-identity-provider-api", () => ({
  fetchTenantIdentityProviderConfiguration: vi.fn(async () => null),
}));

import { fetchTenantIdentityProviderConfiguration } from "@/lib/admin-identity-provider-api";
import { IdentityProvidersRoleMappingPageView } from "./IdentityProvidersRoleMappingPageView";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";
import {
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_TEST_TOKEN,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EMPTY_STATE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL,
  IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOAD_ERROR,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_SAFETY_NOTICE,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED_YET,
} from "@/lib/identity-providers-settings-copy";

const mockFetchTenantIdentityProviderConfiguration = vi.mocked(fetchTenantIdentityProviderConfiguration);

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

describe("IdentityProvidersRoleMappingPageView", () => {
  it("uses status-hub framing for shell H1 instead of in-page editor overclaim (TB-1916)", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("role-mapping-settings-claim-discipline")).not.toBeInTheDocument();
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

  it("renders a single header mapping status badge and hides illustrative examples by default", async () => {
    mockFetchTenantIdentityProviderConfiguration.mockResolvedValueOnce({
      protocol: "Saml",
      claimMappingJson: JSON.stringify({
        roleClaimName: "groups",
        mappings: [{ idpValue: "al-admins", archLucidRole: "Admin" }],
      }),
    });

    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-header-status-badge")).toHaveTextContent(
      IDENTITY_PROVIDERS_STATUS_ENABLED,
    );
    expect(screen.queryByTestId("identity-providers-role-mapping-status-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-role-mapping-examples-disclosure")).not.toHaveAttribute("open");
    expect(screen.queryByTestId("identity-providers-role-mapping-examples")).not.toBeVisible();

    expect(await screen.findByTestId("identity-providers-role-mapping-table")).toBeInTheDocument();
    expect(screen.getByText("al-admins")).toBeInTheDocument();
    expect(screen.getByText(IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL)).toBeInTheDocument();
  });

  it("shows configuration-truthful status and empty state for unconfigured tenants", async () => {
    mockFetchTenantIdentityProviderConfiguration.mockResolvedValueOnce(null);

    render(
      <IdentityProvidersRoleMappingPageView
        model={buildModel({
          authConfigurationDiagnostics: {
            authMode: "ApiKey",
            tenantIdentityProviderProtocol: null,
            roleClaimNameConfigured: false,
            tenantClaimMappingConfigured: false,
            issuerOrAuthorityConfigured: false,
          },
          overview: {
            ...buildModel().overview,
            roleMappingStatus: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED_YET,
          },
        })}
      />,
    );

    const statusCard = screen.getByTestId("identity-providers-role-mapping-status");

    expect(within(statusCard).getByText("Identity source")).toBeInTheDocument();
    expect(within(statusCard).getAllByText("Not configured")).toHaveLength(2);
    expect(screen.getByTestId("identity-providers-header-status-badge")).toHaveTextContent(
      IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED_YET,
    );
    expect(await screen.findByTestId("identity-providers-role-mapping-empty")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_EMPTY_STATE,
    );
  });

  it("shows loading state until auth configuration diagnostics load (TB-1919)", () => {
    render(
      <IdentityProvidersRoleMappingPageView
        model={buildModel({ authConfigurationDiagnosticsLoaded: false, authConfigurationDiagnostics: null })}
      />,
    );

    expect(screen.getByTestId("identity-providers-role-mapping-loading-skeleton")).toHaveAttribute(
      "aria-label",
      IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING,
    );
    expect(screen.queryByTestId("identity-providers-role-mapping-primary-cta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-token-test-mapping-card")).not.toBeInTheDocument();
  });

  it("promotes primary CTA above informational content and keeps one help plus one diagnostics affordance", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    const statusCard = screen.getByTestId("identity-providers-role-mapping-status");
    const primaryCta = within(statusCard).getByTestId("identity-providers-role-mapping-primary-cta");
    const identitySource = within(statusCard).getByText("Identity source");

    expect(primaryCta.compareDocumentPosition(identitySource) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByTestId("page-contextual-help-button")).toHaveLength(1);
    expect(screen.getByTestId("identity-providers-role-mapping-diagnostics-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_TEST_TOKEN,
    );
    expect(screen.getByTestId("auth-token-test-mapping-card")).toBeInTheDocument();
  });

  it("routes OIDC tenants to SSO wizard and token-test anchor (TB-1919)", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-role-mapping-primary-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
    );
    expect(screen.getByTestId("identity-providers-role-mapping-diagnostics-cta")).toHaveAttribute(
      "href",
      "#auth-token-test-mapping-card",
    );
  });

  it("routes SAML tenants to SAML editor primary CTA (TB-1919)", () => {
    render(
      <IdentityProvidersRoleMappingPageView
        model={buildModel({
          authConfigurationDiagnostics: {
            authMode: "JwtBearer",
            tenantIdentityProviderProtocol: "Saml",
            roleClaimNameConfigured: true,
            tenantClaimMappingConfigured: true,
            issuerOrAuthorityConfigured: true,
          },
        })}
      />,
    );

    expect(screen.getByTestId("identity-providers-role-mapping-primary-cta")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
    );
  });

  it("shows load error instead of empty state when mapping fetch fails", async () => {
    mockFetchTenantIdentityProviderConfiguration.mockRejectedValueOnce(new Error("network"));

    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(await screen.findByTestId("identity-providers-role-mapping-load-error")).toHaveTextContent(
      IDENTITY_PROVIDERS_ROLE_MAPPING_LOAD_ERROR,
    );
    expect(screen.queryByTestId("identity-providers-role-mapping-empty")).not.toBeInTheDocument();
  });

  it("reloads configured mappings when shell refresh runs", async () => {
    const refresh = vi.fn(async () => undefined);
    mockFetchTenantIdentityProviderConfiguration
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        protocol: "Saml",
        claimMappingJson: JSON.stringify({
          roleClaimName: "groups",
          mappings: [{ idpValue: "al-admins", archLucidRole: "Admin" }],
        }),
      });

    render(<IdentityProvidersRoleMappingPageView model={buildModel({ refresh })} />);

    expect(await screen.findByTestId("identity-providers-role-mapping-empty")).toBeInTheDocument();

    await refresh.mock.results[0]?.value;
    screen.getByTestId("identity-providers-refresh-button").click();

    expect(await screen.findByTestId("identity-providers-role-mapping-table")).toBeInTheDocument();
    expect(mockFetchTenantIdentityProviderConfiguration).toHaveBeenCalledTimes(2);
  });

  it("renders safety and break-glass notices in a bordered scope container", () => {
    render(<IdentityProvidersRoleMappingPageView model={buildModel()} />);

    expect(screen.getByTestId("identity-providers-safety-notice")).toHaveTextContent(
      IDENTITY_PROVIDERS_SAFETY_NOTICE,
    );
    expect(screen.getByTestId("identity-providers-admin-fallback-notice")).toHaveTextContent(
      IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
    );
    expect(screen.getByTestId("identity-providers-role-mapping-scope-notice")).toBeInTheDocument();
    expect(screen.getByTestId("identity-provider-setup-checklist")).toBeInTheDocument();
    expect(screen.getByTestId("identity-providers-role-mapping-related-surfaces")).toBeInTheDocument();
  });
});
