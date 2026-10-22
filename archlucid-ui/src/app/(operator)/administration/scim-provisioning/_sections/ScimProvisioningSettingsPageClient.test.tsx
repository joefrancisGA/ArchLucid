import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScimProvisioningSettingsPageClient } from "./ScimProvisioningSettingsPageClient";
import {
  SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING,
  SCIM_CREATE_DIALOG_CONFIRM,
  SCIM_TOKEN_CREATED_SUCCESS,
  SCIM_TOKEN_REVOKED_SUCCESS,
  SCIM_VERIFY_STATUS_NOT_VERIFIED,
} from "@/lib/scim-provisioning-page-copy";
import { showSuccess } from "@/lib/toast";
import { writeOperatorScopeToStorage } from "@/lib/operator/operator-scope-storage";

const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const workspaceId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

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

function stubLocationOrigin(origin: string): void {
  vi.stubGlobal("location", { ...window.location, origin });
}

function stubClipboard(): void {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText: vi.fn(async () => undefined) },
    configurable: true,
  });
}

function stubFetchWithEmptyTokens(): void {
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
  stubClipboard();
}

describe("ScimProvisioningSettingsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aligns page content with the admin shell without mx-auto centering", async () => {
    stubFetchWithEmptyTokens();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-no-tokens-empty-state")).toBeInTheDocument();
    });

    const page = screen.getByTestId("scim-provisioning-settings-page");
    expect(page.className).toContain("w-full max-w-[62rem] space-y-4");
    expect(page.className).not.toContain("mx-auto");
  });

  it("renders only the identity-providers vocabulary rail above the orientation callout", async () => {
    stubFetchWithEmptyTokens();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-identity-providers-vocabulary")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("scim-users-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sso-wizard-scim-vocabulary")).not.toBeInTheDocument();
  });

  it("warns and disables SCIM base URL copy on loopback or non-HTTPS origins", async () => {
    stubFetchWithEmptyTokens();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-base-url-reachability-warning")).toBeInTheDocument();
    });

    expect(screen.getByText(SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING)).toBeInTheDocument();
    expect(screen.getByTestId("scim-base-url-copy")).toBeDisabled();
  });

  it("does not warn on HTTPS non-loopback origins", async () => {
    stubFetchWithEmptyTokens();
    stubLocationOrigin("https://app.archlucid.example");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-base-url-input")).toHaveValue(
        "https://app.archlucid.example/api/proxy/scim/v2",
      );
    });

    expect(screen.queryByTestId("scim-base-url-reachability-warning")).not.toBeInTheDocument();
    expect(screen.getByTestId("scim-base-url-copy")).toBeEnabled();
  });

  it("disables verify until a token is present and surfaces StatusTag trust signals", async () => {
    stubFetchWithEmptyTokens();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-verify-token-input")).toBeInTheDocument();
    });

    expect(screen.getByTestId("scim-verify-connection")).toBeDisabled();
    expect(screen.getByTestId("scim-verify-connection-disabled-hint")).toHaveTextContent(
      "Enter a SCIM token before verifying the connection.",
    );
    expect(screen.getByTestId("scim-verify-status-tag")).toHaveTextContent(SCIM_VERIFY_STATUS_NOT_VERIFIED);

    fireEvent.change(screen.getByTestId("scim-verify-token-input"), {
      target: { value: "archlucid_scim.test.token" },
    });

    expect(screen.getByTestId("scim-verify-connection")).toBeEnabled();
  });

  it("presents one create action, SCIM base URL, and customer-facing verification copy", async () => {
    stubFetchWithEmptyTokens();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-no-tokens-empty-state")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("button", { name: "Create SCIM token" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Issue new SCIM token" })).not.toBeInTheDocument();
    expect(screen.getByTestId("scim-base-url-input")).toHaveValue("http://localhost:3000/api/proxy/scim/v2");
    expect(screen.getByText("1. Create a SCIM token")).toBeInTheDocument();
    expect(screen.getByText("2. Verify provisioning")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Confirm that your identity provider can connect to ArchLucid using the SCIM configuration above.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("scim-sso-context-note")).toHaveTextContent("Configure single sign-on");
    expect(screen.getByTestId("scim-verify-create-token-link")).toHaveTextContent("create a new token");

    for (const banned of BANNED_CUSTOMER_COPY) {
      expect(screen.queryByText(new RegExp(banned, "i"))).not.toBeInTheDocument();
    }

    expect(screen.queryByText("Scim provisioning")).not.toBeInTheDocument();
  });

  it("requires confirmation before creating a SCIM token", async () => {
    const plaintextToken = "archlucid_scim.public.secret";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify({ tokens: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
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

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    stubClipboard();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-create-token")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("scim-create-token"));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Create SCIM token?")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/proxy/v1/admin/scim/tokens"),
      expect.objectContaining({ method: "POST" }),
    );

    fireEvent.click(within(dialog).getByRole("button", { name: SCIM_CREATE_DIALOG_CONFIRM }));

    await waitFor(() => {
      expect(screen.getByTestId("scim-token-plaintext")).toHaveValue(plaintextToken);
    });
  });

  it("forwards operator scope headers when verifying SCIM connectivity", async () => {
    writeOperatorScopeToStorage({ tenantId, workspaceId, projectId });

    const plaintextToken = "archlucid_scim.public.secret";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify({ tokens: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
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

      if (url.includes("/api/proxy/scim/v2/ServiceProviderConfig")) {
        return new Response(JSON.stringify({ schemas: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    stubClipboard();
    stubLocationOrigin("https://app.archlucid.example");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-create-token")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("scim-create-token"));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: SCIM_CREATE_DIALOG_CONFIRM }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("scim-token-plaintext")).toHaveValue(plaintextToken);
    });

    fireEvent.click(screen.getByTestId("scim-verify-connection"));

    await waitFor(() => {
      expect(screen.getByTestId("scim-verify-success")).toBeInTheDocument();
    });

    const verifyCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/api/proxy/scim/v2/ServiceProviderConfig"),
    );
    expect(verifyCall).toBeDefined();

    const verifyHeaders = new Headers((verifyCall?.[1] as RequestInit | undefined)?.headers);
    expect(verifyHeaders.get("x-tenant-id")).toBe(tenantId);
    expect(verifyHeaders.get("x-workspace-id")).toBe(workspaceId);
    expect(verifyHeaders.get("x-project-id")).toBe(projectId);
    expect(verifyHeaders.get("Authorization")).toBe(`Bearer ${plaintextToken}`);
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
          { status: 200,
            headers: { "Content-Type": "application/json" } },
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
        const headers = new Headers(init.headers);
        expect(headers.get("Authorization")).toBe(`Bearer ${plaintextToken}`);

        return new Response(JSON.stringify({ schemas: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);
    stubClipboard();
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-active-tokens-table")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("scim-create-token"));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: SCIM_CREATE_DIALOG_CONFIRM }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("scim-token-plaintext")).toHaveValue(plaintextToken);
    });

    expect(screen.getByTestId("scim-mutation-success-callout")).toHaveTextContent(SCIM_TOKEN_CREATED_SUCCESS);
    expect(showSuccess).not.toHaveBeenCalled();

    expect(screen.queryByTestId("scim-verify-token-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("scim-verify-session-hint")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("scim-verify-connection"));

    await waitFor(() => {
      expect(screen.getByTestId("scim-verify-success")).toBeInTheDocument();
    });

    expect(screen.getByTestId("scim-verify-status-tag")).toHaveTextContent("Connection verified");

    fireEvent.click(screen.getByTestId("scim-token-done"));

    await waitFor(() => {
      expect(screen.queryByTestId("scim-token-plaintext")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("scim-verify-token-input")).toBeInTheDocument();
  });

  it("requires confirmation before revoking an active token and renders token status via StatusTag", async () => {
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
    stubLocationOrigin("http://localhost:3000");

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("scim-revoke-token-token-1")).toBeInTheDocument();
    });

    expect(screen.getByText("lookup-key")).toBeInTheDocument();
    expect(screen.getByTestId("scim-token-status-token-1")).toHaveTextContent("Active");
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
    expect(showSuccess).not.toHaveBeenCalled();
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
    stubLocationOrigin("http://localhost:3000");

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

    expect(screen.getByTestId("scim-verify-status-tag")).toHaveTextContent("Verification failed");
    expect(screen.queryByText(/ServiceProviderConfig/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal ServiceProviderConfig failure/i)).not.toBeInTheDocument();
    expect(screen.getByText("View technical details")).toBeInTheDocument();
  });
});

function plaintextTokenPattern(): RegExp {
  return /archlucid_scim\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
}
