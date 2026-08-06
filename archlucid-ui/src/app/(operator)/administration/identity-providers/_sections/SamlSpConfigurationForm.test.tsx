import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SamlSpConfigurationForm } from "./SamlSpConfigurationForm";

describe("SamlSpConfigurationForm", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true));

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);

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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves SAML configuration through POST /v1/admin/identity/activate", async () => {
    render(<SamlSpConfigurationForm />);

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

    fireEvent.change(screen.getByTestId("saml-mapping-idp-Admin"), {
      target: { value: "archlucid-admins" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("saml-save-configuration-button")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("saml-save-configuration-button"));

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
  });
});
