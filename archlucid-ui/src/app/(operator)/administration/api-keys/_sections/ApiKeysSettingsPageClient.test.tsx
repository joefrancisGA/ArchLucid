import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.hoisted(() => vi.fn(() => "/"));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => usePathnameMock(),
  };
});

import { ApiKeysSettingsPageClient } from "./ApiKeysSettingsPageClient";
import { ApiKeysSettingsRestrictedState } from "./ApiKeysSettingsRestrictedState";

vi.mock("@/lib/api-keys-settings-access", () => ({
  isApiKeysSettingsSurfaceEnabled: () => true,
}));

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => false,
}));

describe("ApiKeysSettingsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    usePathnameMock.mockReturnValue("/");
  });

  it("renders the claim-discipline orientation strip on the live settings page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          developmentBypassAll: false,
          admin: { isConfigured: false, maskedSegments: [] },
          readOnly: { isConfigured: false, maskedSegments: [] },
        }),
      }),
    );

    render(<ApiKeysSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("api-keys-settings-page")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("api-keys-continue-last-viewed-row")).toBeInTheDocument();
    });
    expect(screen.getByTestId("api-key-row-admin")).toHaveAttribute("data-api-key-slot", "Admin");
    expect(screen.getByTestId("api-keys-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("api-keys-settings-page-breadcrumb")).not.toBeInTheDocument();
  });

  it("loads masked fingerprints without internal config names and requires admin rotate confirmation", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api-keys") && (!init?.method || init.method === "GET")) {
        return new Response(
          JSON.stringify({
            enabled: true,
            developmentBypassAll: false,
            admin: { isConfigured: true, maskedSegments: ["****cdef"] },
            readOnly: { isConfigured: false, maskedSegments: [] },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/rotate") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            slot: "Admin",
            configPath: "Authentication:ApiKey:AdminKey",
            plaintextKey: "newkeymaterial",
            deploymentAction: "Replace",
            replaceConfigValue: "newkeymaterial",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ApiKeysSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByText("Ends in cdef")).toBeInTheDocument();
    });

    expect(screen.queryByText("Authentication:ApiKey:Enabled")).not.toBeInTheDocument();
    expect(screen.queryByText("DevelopmentBypassAll")).not.toBeInTheDocument();
    expect(screen.queryByText("Key Vault")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rotate admin key" }));

    const dialog = await screen.findByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", { name: "Rotate admin key" });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByTestId("api-key-confirm-phrase"), { target: { value: "Rotate admin key" } });
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("api-key-plaintext")).toHaveValue("newkeymaterial");
    });

    expect(screen.getByText("Copy this key now. ArchLucid will not show it again.")).toBeInTheDocument();
    expect(screen.getByText("Admin key rotated")).toBeInTheDocument();
  });

  it("shows restricted state when surface is disabled", () => {
    usePathnameMock.mockReturnValue("/administration/api-keys");

    render(<ApiKeysSettingsRestrictedState reason="surface_disabled" />);

    expect(screen.getByTestId("api-keys-settings-restricted")).toBeInTheDocument();
    expect(screen.getByTestId("api-keys-settings-restricted-title")).toHaveTextContent(
      "API keys are not managed in this release.",
    );
    expect(screen.queryByTestId("api-keys-settings-page-breadcrumb")).toBeNull();
    expect(screen.getByRole("link", { name: "Users and roles" })).toHaveAttribute(
      "href",
      "/administration/users",
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });
});
