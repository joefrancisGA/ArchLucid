import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiKeysSettingsPageClient } from "./ApiKeysSettingsPageClient";

describe("ApiKeysSettingsPageClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads masked status and shows rotate reveal", async () => {
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
      expect(screen.getByText("****cdef")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Rotate admin key (replace)" }));

    await waitFor(() => {
      expect(screen.getByTestId("api-key-plaintext")).toHaveValue("newkeymaterial");
    });
  });
});
