import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const hoistedIdentityProvidersLoad = vi.hoisted(() => ({ demo: false }));

vi.mock("./_sections/load-identity-providers-settings-page-data", () => ({
  loadIdentityProvidersSettingsPageData: () => Promise.resolve(hoistedIdentityProvidersLoad),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

import IdentityProvidersSettingsPage from "./page";

afterEach(() => {
  hoistedIdentityProvidersLoad.demo = false;
  vi.unstubAllGlobals();
});

function stubIdentityProvidersFetch(keys: unknown[], oidcDiagnostics?: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

      if (url.includes("/diagnostics/identity-providers")) {
        return new Response(
          JSON.stringify({
            oidc: { status: "NotApplicable", summary: "ArchLucidAuth:Mode is not JwtBearer." },
            saml: { status: "NotApplicable", summary: "SAML 2.0 SP integration is disabled." },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url.includes("/auth/oidc-diagnostics")) {
        return new Response(
          JSON.stringify(
            oidcDiagnostics ?? {
              authMode: "JwtBearer",
              configuredAuthority: "https://login.example.com/",
              configuredAudience: "api://demo",
              discoveryAttempted: true,
              discoverySucceeded: true,
              openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
            },
          ),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url.includes("/auth/saml-operational-health")) {
        return new Response(JSON.stringify({ saml2Enabled: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ keys }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

describe("IdentityProvidersSettingsPage", () => {
  it("renders ArchLucidAuth rows when demo build flags are set (still fetches catalog client-side)", async () => {
    hoistedIdentityProvidersLoad.demo = true;

    stubIdentityProvidersFetch([
      {
        section: "ArchLucidAuth",
        configPath: "ArchLucidAuth:Authority",
        isSet: true,
        effectiveValue: "https://login.example.com",
      },
    ]);

    const page = await IdentityProvidersSettingsPage();

    render(page);

    const table = await screen.findByTestId("identity-providers-table");

    expect(table).toHaveTextContent("ArchLucidAuth:Authority");

    const healthCard = await screen.findByTestId("identity-provider-health-card");

    expect(healthCard).toHaveTextContent("Identity provider health");
    expect(healthCard).toHaveTextContent("NotApplicable");

    const samlCard = await screen.findByTestId("saml-operational-health-card");

    expect(samlCard).toHaveTextContent("SAML 2.0 SP operational signals");

    const oidcCard = await screen.findByTestId("oidc-diagnostics-card");

    expect(oidcCard).toHaveTextContent("OIDC discovery diagnostics");
    expect(oidcCard).toHaveTextContent("Healthy");
  });

  it("renders unhealthy OIDC discovery diagnostics", async () => {
    stubIdentityProvidersFetch(
      [
        {
          section: "ArchLucidAuth",
          configPath: "ArchLucidAuth:Authority",
          isSet: true,
          effectiveValue: "https://login.example.com",
        },
      ],
      {
        authMode: "JwtBearer",
        configuredAuthority: "https://login.example.com/",
        configuredAudience: "api://demo",
        discoveryAttempted: true,
        discoverySucceeded: false,
        discoveryError: "HTTP 404 Not Found",
        openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
      },
    );

    const page = await IdentityProvidersSettingsPage();

    render(page);

    const oidcCard = await screen.findByTestId("oidc-diagnostics-card");

    expect(oidcCard).toHaveTextContent("OIDC discovery diagnostics");
    expect(screen.getByTestId("oidc-diagnostics-discovery-status")).toHaveTextContent("Unreachable");
    expect(screen.getByTestId("oidc-diagnostics-discovery-error")).toHaveTextContent("HTTP 404 Not Found");
  });

  it("renders ArchLucidAuth rows from configuration summary", async () => {
    stubIdentityProvidersFetch([
      {
        section: "ArchLucidAuth",
        configPath: "ArchLucidAuth:Authority",
        isSet: true,
        effectiveValue: "https://login.example.com",
      },
      {
        section: "ArchLucidAuth",
        configPath: "ArchLucidAuth:Audience",
        isSet: true,
        effectiveValue: "api://demo",
      },
    ]);

    const page = await IdentityProvidersSettingsPage();

    render(page);

    const table = await screen.findByTestId("identity-providers-table");

    expect(table).toHaveTextContent("ArchLucidAuth:Authority");
    expect(table).toHaveTextContent("ArchLucidAuth:Audience");

    const healthCard = await screen.findByTestId("identity-provider-health-card");

    expect(healthCard).toHaveTextContent("Identity provider health");

    const samlCard = await screen.findByTestId("saml-operational-health-card");

    expect(samlCard).toHaveTextContent("SAML 2.0 SP operational signals");

    const oidcCard = await screen.findByTestId("oidc-diagnostics-card");

    expect(oidcCard).toHaveTextContent("OIDC discovery diagnostics");
  });
});
