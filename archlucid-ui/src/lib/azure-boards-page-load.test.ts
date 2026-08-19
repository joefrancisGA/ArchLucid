import { describe, expect, it } from "vitest";

import { buildAzureBoardsPageLoadResult, settleAzureBoardsPageLoadSlice } from "@/lib/azure-boards-page-load";

describe("azure-boards-page-load", () => {
  it("keeps fulfilled values and marks rejected slices failed", () => {
    const settled = settleAzureBoardsPageLoadSlice(
      { status: "fulfilled", value: { ok: true } },
      "connection",
    );

    expect(settled.value).toEqual({ ok: true });
    expect(settled.failed).toBe(false);
    expect(settled.errorMessage).toBeNull();
  });

  it("maps rejected reasons to slice error messages", () => {
    const settled = settleAzureBoardsPageLoadSlice(
      { status: "rejected", reason: new Error("Database Query Failed") },
      "settings",
    );

    expect(settled.value).toBeNull();
    expect(settled.failed).toBe(true);
    expect(settled.errorMessage).toBe("Database Query Failed");
  });

  it("builds a partial load where settings fail without clearing connection (TB-1152)", () => {
    const result = buildAzureBoardsPageLoadResult({
      itsmHealth: { status: "fulfilled", value: { nativeEnabled: true } },
      settings: { status: "rejected", reason: new Error("Database Query Failed") },
      connection: {
        status: "fulfilled",
        value: {
          provider: "AzureBoards",
          isConfigured: true,
          instanceBaseUrl: "https://dev.azure.com/example",
          credentialKeyVaultSecretName: "kv-pat",
        },
      },
    });

    expect(result.connection.value?.instanceBaseUrl).toBe("https://dev.azure.com/example");
    expect(result.settings.value).toBeNull();
    expect(result.settings.failed).toBe(true);
    expect(result.failedSliceLabels).toEqual(["Azure Boards settings"]);
    expect(result.loadError).toBe("Database Query Failed");
  });

  it("uses a slice fallback when the rejection is not a named Error", () => {
    const settled = settleAzureBoardsPageLoadSlice({ status: "rejected", reason: "nope" }, "itsmHealth");

    expect(settled.failed).toBe(true);
    expect(settled.errorMessage).toBe("Could not load work management health.");
  });

  it("joins multiple slice failures into one load error", () => {
    const result = buildAzureBoardsPageLoadResult({
      itsmHealth: { status: "rejected", reason: new Error("a") },
      settings: { status: "rejected", reason: new Error("b") },
      connection: { status: "fulfilled", value: { provider: "AzureBoards" } },
    });

    expect(result.loadError).toBe(
      "Some Azure Boards data could not be loaded (work management health, Azure Boards settings).",
    );
  });
});
