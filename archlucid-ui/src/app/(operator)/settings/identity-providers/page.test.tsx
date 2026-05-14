import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const hoistedIdentityProvidersLoad = vi.hoisted(() => ({ demo: false }));

vi.mock("./_sections/load-identity-providers-settings-page-data", () => ({
  loadIdentityProvidersSettingsPageData: () => Promise.resolve(hoistedIdentityProvidersLoad),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

import IdentityProvidersSettingsPage from "./page";

describe("IdentityProvidersSettingsPage", () => {
  it("renders ArchLucidAuth rows from configuration summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            keys: [
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
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const page = await IdentityProvidersSettingsPage();

    render(page);

    const table = await screen.findByTestId("identity-providers-table");

    expect(table).toHaveTextContent("ArchLucidAuth:Authority");
    expect(table).toHaveTextContent("ArchLucidAuth:Audience");
    vi.unstubAllGlobals();
  });
});
