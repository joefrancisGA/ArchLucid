import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScimProvisioningSettingsPageClient } from "./ScimProvisioningSettingsPageClient";
import { SCIM_TOKEN_CREATED_SUCCESS, SCIM_TOKEN_REVOKED_SUCCESS } from "@/lib/scim-provisioning-page-copy";

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

const BANNED_CUSTOMER_COPY = [
  "ServiceProviderConfig",
  "Calls GET",
  "bearer token you plan",
  "Issue new SCIM token",
  "Open SSO wizard",
];

describe("ScimProvisioningSettingsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("presents one create action, SCIM base URL, and customer-facing verification copy", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify({ tokens: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => undefined) } });

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-no-tokens-empty-state")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("button", { name: "Create SCIM token" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Issue new SCIM token" })).not.toBeInTheDocument();
    expect(screen.getByTestId("scim-base-url-input")).toHaveValue("http://localhost:3000/api/proxy/scim/v2");
    expect(screen.getByText("2. Verify provisioning")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Confirm that your identity provider can connect to ArchLucid using the SCIM configuration above.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("scim-sso-context-note")).toHaveTextContent("Configure single sign-on");

    for (const banned of BANNED_CUSTOMER_COPY) {
      expect(screen.queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
    }

    expect(screen.queryByText("Scim provisioning")).not.toBeInTheDocument();
  });

  it("creates a token once, verifies with the session token, and clears secrets on Done", async () => {
    const plaintextToken = "archlucid_scim.public.secret";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify({
            tokens: [{ id: "token-1", createdUtc: "2026-01-01T00:00:00Z", publicLookupKey: "lookup-key" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            id: "token-1",
            publicLookupKey: "lookup-key",
            plaintextToken,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/proxy/scim/v2/ServiceProviderConfig") && init?.headers) {
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBe(`Bearer ${plaintextToken}`);

        return new Response(JSON.stringify({ schemas: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => undefined) } });

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-active-tokens-table")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("scim-create-token"));

    await waitFor(() => {
      expect(screen.getByTestId("scim-token-plaintext")).toHaveValue(plaintextToken);
    });

    expect(screen.getByTestId("scim-mutation-success-callout")).toHaveTextContent(SCIM_TOKEN_CREATED_SUCCESS);

    expect(screen.queryByTestId("scim-verify-token-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("scim-verify-session-hint")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("scim-verify-connection"));

    await waitFor(() => {
      expect(screen.getByTestId("scim-verify-success")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("scim-token-done"));

    await waitFor(() => {
      expect(screen.queryByTestId("scim-token-plaintext")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("scim-verify-token-input")).toBeInTheDocument();
  });

  it("requires confirmation before revoking an active token", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify({
            tokens: [{ id: "token-1", createdUtc: "2026-01-01T00:00:00Z", publicLookupKey: "lookup-key" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/proxy/v1/admin/scim/tokens/token-1") && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-revoke-token-token-1")).toBeInTheDocument();
    });

    expect(screen.getByText("lookup-key")).toBeInTheDocument();
    expect(screen.queryByText(plaintextTokenPattern())).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("scim-revoke-token-token-1"));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Revoke SCIM token?")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke token" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/proxy/v1/admin/scim/tokens/token-1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(screen.getByTestId("scim-mutation-success-callout")).toHaveTextContent(SCIM_TOKEN_REVOKED_SUCCESS);
  });

  it("sanitizes verification failures without exposing response payloads", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify({ tokens: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/proxy/scim/v2/ServiceProviderConfig")) {
        return new Response('{"detail":"internal ServiceProviderConfig failure"}', { status: 401 });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-verify-token-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("scim-verify-token-input"), {
      target: { value: "archlucid_scim.test.token" },
    });
    fireEvent.click(screen.getByTestId("scim-verify-connection"));

    await waitFor(() => {
      expect(screen.getByTestId("scim-verify-failure")).toBeInTheDocument();
    });

    expect(screen.queryByText(/ServiceProviderConfig/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal ServiceProviderConfig failure/i)).not.toBeInTheDocument();
    expect(screen.getByText("View technical details")).toBeInTheDocument();
  });
});

function plaintextTokenPattern(): RegExp {
  return /archlucid_scim\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
}
