import { describe, expect, it, vi } from "vitest";

import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

const fetchCloudResourceEvidenceHub = vi.fn();

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  fetchCloudResourceEvidenceHub: (...args: unknown[]) => fetchCloudResourceEvidenceHub(...args),
}));

describe("infra-evidence-resource-hub-cache", () => {
  it("reads, writes, invalidates, and coalesces hub fetches", async () => {
    vi.resetModules();
    const {
      buildInfraEvidenceResourceHubCacheKey,
      fetchCachedInfraEvidenceResourceHub,
      invalidateInfraEvidenceResourceHubCache,
      invalidateInfraEvidenceResourceHubCacheForResource,
      readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub,
    } = await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");

    const cacheKey = buildInfraEvidenceResourceHubCacheKey(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    );
    const hub = {
      cloudResourceId: "11111111-1111-1111-1111-111111111111",
    } as CloudResourceEvidenceHubResponse;

    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toBeNull();

    writeCachedInfraEvidenceResourceHub(cacheKey, hub);

    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toEqual(hub);

    invalidateInfraEvidenceResourceHubCache(cacheKey);

    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toBeNull();

    fetchCloudResourceEvidenceHub.mockResolvedValueOnce(hub);
    const first = await fetchCachedInfraEvidenceResourceHub("11111111-1111-1111-1111-111111111111", {
      snapshotId: "22222222-2222-2222-2222-222222222222",
    });
    const second = await fetchCachedInfraEvidenceResourceHub("11111111-1111-1111-1111-111111111111", {
      snapshotId: "22222222-2222-2222-2222-222222222222",
    });

    expect(first).toEqual(hub);
    expect(second).toEqual(hub);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(1);

    invalidateInfraEvidenceResourceHubCacheForResource("11111111-1111-1111-1111-111111111111");
    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toBeNull();
  });
});
