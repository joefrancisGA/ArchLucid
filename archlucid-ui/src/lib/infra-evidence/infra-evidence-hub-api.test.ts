import { describe, expect, it, vi } from "vitest";

import {
  fetchCloudResourceEvidenceHub,
  fetchCloudResourceExplorerPage,
} from "@/lib/infra-evidence/infra-evidence-hub-api";
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

  it("propagates a failed run read even for the workbook fixture resource", async () => {
    vi.mocked(proxyJsonGet).mockRejectedValueOnce(new Error("access denied"));
    await expect(fetchCloudResourceEvidenceHub("11111111-1111-1111-1111-111111111111", { runId: "run-1" }))
      .rejects.toThrow();
    expect(proxyJsonGet).toHaveBeenLastCalledWith(expect.stringContaining("runId=run-1"), { cache: "no-store" });
  });

  it("surfaces a freshness conflict instead of returning workbook fallback evidence", async () => {
    const detail = "The last inventory snapshot is too old to show as current.";
    vi.mocked(proxyJsonGet).mockRejectedValueOnce({
      message: "Conflict",
      problem: { detail },
      correlationId: null,
      httpStatus: 409,
      retryAfterSeconds: null,
    });

    await expect(fetchCloudResourceEvidenceHub("11111111-1111-1111-1111-111111111111", {}))
      .rejects.toThrow(detail);
  });

  it("does not replace a failed pinned snapshot with the workbook fixture", async () => {
    vi.mocked(proxyJsonGet).mockRejectedValueOnce(new Error("Pinned snapshot not found"));
    await expect(fetchCloudResourceEvidenceHub("11111111-1111-1111-1111-111111111111", {
      snapshotId: "33333333-3333-3333-3333-333333333333",
    })).rejects.toThrow("Pinned snapshot not found");
  });

  it("retains the local workbook fallback only for the exact fixture snapshot", async () => {
    vi.mocked(proxyJsonGet).mockRejectedValueOnce(new Error("Local API unavailable"));
    const snapshotId = "22222222-2222-2222-2222-222222222222";
    const hub = await fetchCloudResourceEvidenceHub("11111111-1111-1111-1111-111111111111", { snapshotId });
    expect(hub.currentConfiguration?.snapshotId).toBe(snapshotId);
  });

  it("preserves missing versus empty hub correspondence and stream values", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce({
      cloudResourceId: "resource-1",
      externalResourceId: "external-1",
      diagramCorrespondence: {
        correspondenceId: "corr-1",
        matchKind: "",
        explainText: "",
      },
      operationalSecurityFindings: { streamKind: "operational" },
      architectureReviewFindings: { streamKind: "architecture", streamLabel: "" },
    });

    const hub = await fetchCloudResourceEvidenceHub("resource-1", {});

    expect(hub.diagramCorrespondence).toEqual(expect.objectContaining({
      matchKind: "",
      explainText: "",
    }));
    expect(hub.operationalSecurityFindings.streamLabel).toBeNull();
    expect(hub.architectureReviewFindings.streamLabel).toBe("");
  });
});
