import { describe, expect, it, vi } from "vitest";

import { fetchCloudResourceExplorerPage } from "@/lib/infra-evidence/infra-evidence-hub-api";
import { proxyJsonGet } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
}));

describe("infra-evidence-hub-api", () => {
  it("drops incomplete resource rows before exposing an explorer page", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce({
      items: [
        {
          cloudResourceId: "resource-1",
          externalResourceId: "/subscriptions/example/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store",
          lastSeenUtc: "2026-09-25T12:00:00Z",
          displayName: "store",
        },
        {
          cloudResourceId: "resource-without-external-id",
          lastSeenUtc: "2026-09-25T12:00:00Z",
        },
        {
          cloudResourceId: "resource-without-last-seen",
          externalResourceId: "/subscriptions/example/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault",
        },
      ],
      totalCount: 3,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const page = await fetchCloudResourceExplorerPage({});

    expect(page.items).toEqual([
      expect.objectContaining({
        cloudResourceId: "resource-1",
        externalResourceId: "/subscriptions/example/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store",
        lastSeenUtc: "2026-09-25T12:00:00Z",
      }),
    ]);
  });
});
