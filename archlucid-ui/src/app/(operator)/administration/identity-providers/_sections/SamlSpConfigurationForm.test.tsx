import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration/identity-providers/saml",
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { IdentityProvidersSamlPageClient } from "./IdentityProvidersSamlPageClient";
import { IdentityProvidersSettingsProvider } from "./IdentityProvidersSettingsProvider";
import { SamlSpConfigurationForm } from "./SamlSpConfigurationForm";
import { SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import {
  IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA,
  IDENTITY_PROVIDERS_ACTION_SAVE,
  IDENTITY_PROVIDERS_ACTION_VALIDATE,
  IDENTITY_PROVIDERS_SAML_ISSUER_LABEL,
  IDENTITY_PROVIDERS_SAML_METADATA_URL_HELPER,
  IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_SAML_PAGE_TITLE,
  IDENTITY_PROVIDERS_SAML_MAPPING_VALIDATION_REQUIRED,
  IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { showSuccess } from "@/lib/toast";

const loaded = {
  demo: false,
};

function renderSamlPageClient(): ReturnType<typeof render> {
  return render(
    <IdentityProvidersSettingsProvider loaded={loaded}>
      <IdentityProvidersSamlPageClient />
    </IdentityProvidersSettingsProvider>,
  );
}

function stubIdentityFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
          { status: 200, headers: { "Content-Type": "application/json" },
          },
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

      if (url.includes("/admin/identity/discover")) {
        return new Response(
          JSON.stringify({
            discoverySucceeded: true,
            issuerUri: "https://idp.example.com/",
            availableClaimNames: ["groups"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/admin/identity/activate") && init?.method === "POST") {
        return new Response(JSON.stringify({ isActive: true, updatedUtc: "2026-06-26T12:00:00Z" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("unexpected", { status: 500 });
    }),
  );
}

async function completeMinimalSamlForm(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId("saml-idp-metadata-url")).toBeInTheDocument();
  });

  fireEvent.change(screen.getByTestId("saml-idp-metadata-url"), {
    target: { value: "https://idp.example.com/metadata" },
  });
  fireEvent.click(screen.getByTestId("saml-fetch-metadata-button"));

  await waitFor(() => {
    expect(screen.getByTestId("saml-sp-issuer")).toHaveValue("https://idp.example.com/");
  });

  const firstMappingInput = screen.getAllByLabelText(/IdP group or role value for mapping/i)[0];
  fireEvent.change(firstMappingInput, {
    target: { value: "archlucid-admins" },
  });

  await waitFor(() => {
    expect(screen.getByTestId("saml-save-configuration-button")).not.toBeDisabled();
  });
}

describe("SamlSpConfigurationForm", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    stubIdentityFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves SAML configuration through POST /v1/admin/identity/activate", async () => {
    render(<SamlSpConfigurationForm />);

    await completeMinimalSamlForm();
    fireEvent.click(screen.getByTestId("saml-save-configuration-button"));

    expect(
      await screen.findByRole("heading", { name: IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: IDENTITY_PROVIDERS_ACTION_SAVE }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        "/api/proxy/v1/admin/identity/activate",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"protocol":"saml"'),
        }),
      );
    });

    const activateCall = vi
      .mocked(fetch)
      .mock.calls.find((call) => String(call[0]).includes("/admin/identity/activate"));
    const body = JSON.parse(String((activateCall?.[1] as RequestInit | undefined)?.body ?? "{}")) as {
      issuerUri?: string;
      claimMapping?: { mappings?: { idpValue?: string }[] };
    };

    expect(body.issuerUri).toBe("https://idp.example.com/");
    expect(body.claimMapping?.mappings?.[0]?.idpValue).toBe("archlucid-admins");

    expect(await screen.findByTestId("saml-sp-configuration-success-callout")).toHaveTextContent(
      SAML_CONFIGURATION_SAVED_SUCCESS_MESSAGE,
    );
    expect(showSuccess).not.toHaveBeenCalled();
    expect(globalThis.confirm).not.toHaveBeenCalled();
  });

  it("labels metadata discovery as Fetch IdP metadata, not Validate configuration (TB-1921)", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByTestId("saml-fetch-metadata-button")).toHaveTextContent(
        IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA,
      );
    });

    expect(screen.getByTestId("saml-fetch-metadata-button")).not.toHaveTextContent(
      IDENTITY_PROVIDERS_ACTION_VALIDATE,
    );
    expect(screen.getByTestId("saml-fetch-metadata-disabled-hint")).toHaveTextContent(/IdP metadata URL/i);
  });

  it("shows why-disabled helper copy before SAML configuration can be saved", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByTestId("saml-save-configuration-button")).toBeDisabled();
    });

    expect(screen.getByTestId("saml-save-configuration-disabled-hint")).toHaveTextContent(
      /Identity provider issuer \(IdP entity ID\) is required/i,
    );
    expect(screen.getByTestId("saml-save-readiness-list")).toHaveTextContent(
      IDENTITY_PROVIDERS_SAML_MAPPING_VALIDATION_REQUIRED,
    );
    expect(screen.getByTestId("saml-sp-issuer")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("saml-sp-issuer-error")).toBeInTheDocument();
  });

  it("uses in-page save confirmation instead of window.confirm (TB-1922)", async () => {
    render(<SamlSpConfigurationForm />);

    await completeMinimalSamlForm();
    fireEvent.click(screen.getByTestId("saml-save-configuration-button"));

    expect(
      await screen.findByRole("heading", { name: IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(globalThis.confirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE }),
      ).not.toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).not.toHaveBeenCalledWith(
      "/api/proxy/v1/admin/identity/activate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not repeat SAML configuration as a card title (TB-1923)", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByTestId("saml-sp-configuration-form")).toBeInTheDocument();
    });

    const form = screen.getByTestId("saml-sp-configuration-form");
    expect(within(form).queryByRole("heading", { name: IDENTITY_PROVIDERS_SAML_PAGE_TITLE })).toBeNull();
  });

  it("uses design-system Select for ArchLucid role mapping and collapses regex under Advanced (TB-1924)", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/ArchLucid role for mapping/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByTestId("saml-sp-configuration-form").querySelector("select")).toBeNull();
    expect(screen.getByTestId("saml-advanced-settings")).toBeInTheDocument();
    expect(screen.getByTestId("saml-advanced-settings")).not.toHaveAttribute("open");
    expect(within(screen.getByTestId("saml-advanced-settings")).getByTestId("saml-group-regex")).toBeInTheDocument();
  });

  it("labels metadata URL as a lookup that is not stored", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByTestId("saml-idp-metadata-lookup-block")).toBeInTheDocument();
    });

    expect(screen.getByTestId("saml-idp-metadata-lookup-block")).toHaveTextContent(
      IDENTITY_PROVIDERS_SAML_METADATA_URL_HELPER,
    );
  });

  it("shows tenant-wide scope chip beside save", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByTestId("mutating-in-tenant-chip")).toBeInTheDocument();
    });

    expect(screen.getByTestId("mutating-in-tenant-chip")).toHaveAttribute("data-prefix", "Applies tenant-wide");
    expect(screen.queryByTestId("mutating-in-workspace-chip")).toBeNull();
  });

  it("states save does not change sign-in and does not claim the wizard enables it", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByTestId("saml-save-effect-line")).toBeInTheDocument();
    });

    const effectLine = screen.getByTestId("saml-save-effect-line");

    expect(effectLine).toHaveTextContent(/does not change how anyone signs in today/i);
    expect(effectLine).toHaveTextContent(/separate platform configuration change/i);
    // Activate persists the tenant record only; no surface in this UI enables SAML sign-in.
    expect(effectLine).not.toHaveTextContent(/Activate step/i);
    expect(screen.getByRole("link", { name: /SSO setup wizard/i })).toHaveAttribute(
      "href",
      "/administration/identity/sso-wizard",
    );
  });

  it("labels issuer field as the identity provider side", async () => {
    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(IDENTITY_PROVIDERS_SAML_ISSUER_LABEL)).toBeInTheDocument();
    });
  });

  it("supports multiple IdP groups mapped to the same ArchLucid role", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

        if (url.includes("/admin/identity/configuration")) {
          return new Response(
            JSON.stringify({
              protocol: "Saml",
              issuerUri: "https://idp.example.com/",
              claimMappingJson: JSON.stringify({
                roleClaimName: "groups",
                mappings: [
                  { idpValue: "admins-a", archLucidRole: "Admin" },
                  { idpValue: "admins-b", archLucidRole: "Admin" },
                ],
              }),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(null, { status: 404 });
      }),
    );

    render(<SamlSpConfigurationForm />);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/IdP group or role value for mapping/i)).toHaveLength(2);
    });

    const inputs = screen.getAllByLabelText(/IdP group or role value for mapping/i);
    expect(inputs[0]).toHaveValue("admins-a");
    expect(inputs[1]).toHaveValue("admins-b");
    expect(screen.getAllByLabelText(/ArchLucid role for mapping/i)).toHaveLength(2);
  });
});

describe("IdentityProvidersSamlPageClient", () => {
  beforeEach(() => {
    stubIdentityFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses SAML-specific shell subtitle instead of generic configure intro (TB-1923)", async () => {
    renderSamlPageClient();

    expect(await screen.findByText(IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: IDENTITY_PROVIDERS_SAML_PAGE_TITLE })).toBeInTheDocument();
  });

  it("shows SAML operational health strip when model data is available (TB-1924)", async () => {
    renderSamlPageClient();

    expect(await screen.findByTestId("saml-operational-health-card")).toBeInTheDocument();
  });

  it("renders ArchLucid SP values card with copyable ACS URL", async () => {
    renderSamlPageClient();

    expect(await screen.findByTestId("archlucid-saml-sp-values-card")).toBeInTheDocument();
    expect(screen.getByTestId("archlucid-saml-sp-acs-url")).toBeInTheDocument();
  });

  it("mounts saved-configuration test mapping card on the SAML route", async () => {
    renderSamlPageClient();

    expect(await screen.findByTestId("auth-token-test-mapping-card")).toBeInTheDocument();
    expect(screen.getByTestId("auth-token-test-mapping-card")).toHaveTextContent(
      /saved SAML configuration for this organization/i,
    );
    expect(screen.getByTestId("auth-token-test-mapping-card")).toHaveTextContent(/Unsaved edits on this form are not included/i);
  });

  it("shows admin fallback notice on the SAML route", async () => {
    renderSamlPageClient();

    expect(await screen.findByTestId("identity-providers-admin-fallback-notice")).toBeInTheDocument();
  });

  it("renders disabled SAML status with StatusTag when SAML sign-in is off", async () => {
    renderSamlPageClient();

    expect(await screen.findByTestId("saml-operational-health-status")).toBeInTheDocument();
    expect(screen.getByTestId("saml-operational-health-disabled-copy")).toHaveTextContent(/organization/i);
    expect(screen.queryByText(/for this workspace/i)).toBeNull();
  });
});

describe("SamlSpConfigurationForm source guards (TB-1921–TB-1923)", () => {
  it("does not call window.confirm for SAML save", () => {
    const sectionsDir = join(process.cwd(), "src/app/(operator)/administration/identity-providers/_sections");
    const formSource = readFileSync(join(sectionsDir, "SamlSpConfigurationForm.tsx"), "utf8");
    const metadataLookupSource = readFileSync(join(sectionsDir, "SamlSpMetadataLookupBlock.tsx"), "utf8");
    const hookSource = readFileSync(join(sectionsDir, "use-saml-sp-configuration-form.ts"), "utf8");
    const source = `${formSource}\n${metadataLookupSource}\n${hookSource}`;

    expect(source).not.toContain("globalThis.confirm");
    expect(source).not.toContain("window.confirm");
    expect(source).toContain("IdentityProvidersSaveConfirmDialog");
    expect(source).toContain("IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA");
    expect(source).not.toContain("IDENTITY_PROVIDERS_ACTION_VALIDATE");
  });
});
