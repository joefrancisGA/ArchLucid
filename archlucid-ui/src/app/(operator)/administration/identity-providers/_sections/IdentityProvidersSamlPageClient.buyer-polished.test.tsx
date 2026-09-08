import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal, {
    usePathname: () => "/administration/identity-providers/saml",
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
  useNavCommittedArchitectureReview: () => false,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      authorityRank: 100,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    workspaceLabel: "Claims Intake Demo",
    tenantId: "tenant-1",
    projectLabel: "Default",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

import { IdentityProvidersSamlPageClient } from "./IdentityProvidersSamlPageClient";
import { IdentityProvidersSettingsProvider } from "./IdentityProvidersSettingsProvider";
import {
  BUYER_IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";
import {
  IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE,
  IDENTITY_PROVIDERS_SAML_ORIENTATION_SOURCES,
} from "@/lib/identity-providers-saml-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  SAML_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  SAML_SETTINGS_PRIMARY_CONTENT_ID,
  SAML_SETTINGS_SKIP_LINK_LABEL,
  SAML_SETTINGS_SKIP_TARGET_ID,
} from "./saml-settings-page-copy";

const loaded = {
  demo: false,
};

function stubIdentityFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

      if (url.includes("/admin/config/summary")) {
        return new Response(JSON.stringify({ keys: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/diagnostics/identity-providers")) {
        return new Response(
          JSON.stringify({
            oidc: { status: "Healthy", summary: "OIDC configured." },
            saml: { status: "NotApplicable", summary: "SAML disabled." },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/auth/configuration-diagnostics")) {
        return new Response(
          JSON.stringify({
            authMode: "JwtBearer",
            audienceConfigured: true,
            issuerOrAuthorityConfigured: true,
            openIdDiscoverySucceeded: true,
            saml2Enabled: false,
            tenantClaimMappingConfigured: false,
            roleClaimNameConfigured: false,
            misconfigurationHints: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/auth/oidc-diagnostics")) {
        return new Response(
          JSON.stringify({
            authMode: "JwtBearer",
            configuredAuthority: "https://login.example.com/",
            configuredAudience: "api://demo",
            discoveryAttempted: true,
            discoverySucceeded: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/auth/saml-operational-health")) {
        return new Response(JSON.stringify({ status: "NotApplicable" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/admin/identity/configuration")) {
        return new Response(null, { status: 404 });
      }

      return new Response("unexpected", { status: 500 });
    }),
  );
}

describe("IdentityProvidersSamlPageClient buyer-polished shell (ASA)", () => {
  beforeEach(() => {
    stubIdentityFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders skip link, first-viewport band, orientation above configuration form, and buyer subtitle", async () => {
    render(
      <IdentityProvidersSettingsProvider loaded={loaded}>
        <IdentityProvidersSamlPageClient />
      </IdentityProvidersSettingsProvider>,
    );

    expect(screen.getByRole("link", { name: SAML_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SAML_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("identity-providers-settings-primary-content")).toHaveAttribute(
      "id",
      SAML_SETTINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("identity-providers-saml-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByText(BUYER_IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-providers-admin-fallback-notice")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: IDENTITY_PROVIDERS_SAML_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("saml-sp-configuration-form")).toBeInTheDocument();
    });

    const primaryContent = screen.getByTestId("identity-providers-settings-primary-content");
    const firstViewport = screen.getByTestId(SAML_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("identity-providers-saml-orientation-top");
    const configurationForm = screen.getByTestId("saml-sp-configuration-form");
    const sourcesSection = screen.getByTestId("identity-providers-saml-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(configurationForm);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(configurationForm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(IDENTITY_PROVIDERS_SAML_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
