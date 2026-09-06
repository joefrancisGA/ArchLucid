import { describe, expect, it, vi } from "vitest";

import { fetchInfraEvidenceDiffChanges } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { proxyJsonGet } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
}));

describe("infra-evidence-drift-api", () => {
  it("fetchInfraEvidenceDiffChanges appends cloudResourceId when scoped", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });

    await fetchInfraEvidenceDiffChanges("diff-1", 1, 100, {
      cloudResourceId: "11111111-1111-1111-1111-111111111111",
    });

    expect(proxyJsonGet).toHaveBeenCalledWith(
      "/api/proxy/v1/infra-evidence/diffs/diff-1/changes?page=1&pageSize=100&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });
});
