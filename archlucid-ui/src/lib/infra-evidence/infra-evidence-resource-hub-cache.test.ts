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
      {
        snapshotId: "22222222-2222-2222-2222-222222222222",
        runId: "run-1",
        assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      },
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
      runId: "run-1",
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });
    const second = await fetchCachedInfraEvidenceResourceHub("11111111-1111-1111-1111-111111111111", {
      snapshotId: "22222222-2222-2222-2222-222222222222",
      runId: "run-1",
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    });

    expect(first).toEqual(hub);
    expect(second).toEqual(hub);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(1);

    invalidateInfraEvidenceResourceHubCacheForResource("11111111-1111-1111-1111-111111111111");
    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toBeNull();
  });

  it("does not reuse cache entries across different audit scope identities", async () => {
    vi.resetModules();
    const {
      buildInfraEvidenceResourceHubCacheKey,
      readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub,
    } = await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");

    const resourceId = "11111111-1111-1111-1111-111111111111";
    const snapshotId = "22222222-2222-2222-2222-222222222222";
    const firstKey = buildInfraEvidenceResourceHubCacheKey(resourceId, {
      snapshotId,
      controlId: "control-a",
    });
    const secondKey = buildInfraEvidenceResourceHubCacheKey(resourceId, {
      snapshotId,
      controlId: "control-b",
    });
    const firstHub = { cloudResourceId: resourceId, controlId: "control-a" } as CloudResourceEvidenceHubResponse;
    const secondHub = { cloudResourceId: resourceId, controlId: "control-b" } as CloudResourceEvidenceHubResponse;

    writeCachedInfraEvidenceResourceHub(firstKey, firstHub);
    writeCachedInfraEvidenceResourceHub(secondKey, secondHub);

    expect(readCachedInfraEvidenceResourceHub(firstKey)).toEqual(firstHub);
    expect(readCachedInfraEvidenceResourceHub(secondKey)).toEqual(secondHub);
    expect(firstKey).not.toEqual(secondKey);
  });

  it("ignores stale in-flight writes after invalidation", async () => {
    vi.resetModules();
    const {
      buildInfraEvidenceResourceHubCacheKey,
      fetchCachedInfraEvidenceResourceHub,
      invalidateInfraEvidenceResourceHubCache,
      readCachedInfraEvidenceResourceHub,
    } = await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");

    const resourceId = "11111111-1111-1111-1111-111111111111";
    const cacheKey = buildInfraEvidenceResourceHubCacheKey(resourceId, { snapshotId: "snap-1" });
    let resolveFetch: ((hub: CloudResourceEvidenceHubResponse) => void) | undefined;
    const staleHub = { cloudResourceId: resourceId, stale: true } as CloudResourceEvidenceHubResponse;
    const freshHub = { cloudResourceId: resourceId, stale: false } as CloudResourceEvidenceHubResponse;

    fetchCloudResourceEvidenceHub.mockImplementationOnce(
      () =>
        new Promise<CloudResourceEvidenceHubResponse>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    fetchCloudResourceEvidenceHub.mockResolvedValueOnce(freshHub);

    const inflight = fetchCachedInfraEvidenceResourceHub(resourceId, { snapshotId: "snap-1" });
    invalidateInfraEvidenceResourceHubCache(cacheKey);
    resolveFetch?.(staleHub);
    await inflight;
    const fresh = await fetchCachedInfraEvidenceResourceHub(resourceId, { snapshotId: "snap-1" });

    expect(readCachedInfraEvidenceResourceHub(cacheKey)).toEqual(freshHub);
    expect(fresh).toEqual(freshHub);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(2);
  });
});
