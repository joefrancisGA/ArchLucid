import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

const fetchCloudResourceEvidenceHub = vi.fn();
const getEffectiveBrowserProxyScopeHeaders = vi.fn();
const readSignedInUserSubject = vi.fn();
const isJwtAuthMode = vi.fn();

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  fetchCloudResourceEvidenceHub: (...args: unknown[]) => fetchCloudResourceEvidenceHub(...args),
}));
vi.mock("@/lib/operator/operator-scope-storage", () => ({
  getEffectiveBrowserProxyScopeHeaders: () => getEffectiveBrowserProxyScopeHeaders(),
}));
vi.mock("@/lib/oidc/session", () => ({
  readSignedInUserSubject: () => readSignedInUserSubject(),
}));
vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => isJwtAuthMode(),
}));

const RESOURCE = "11111111-1111-1111-1111-111111111111";
const scope = (tenant = "tenant-1", workspace = "workspace-1", project = "project-1") => ({
  "x-tenant-id": tenant,
  "x-workspace-id": workspace,
  "x-project-id": project,
});
const hub = (label: string) => ({ cloudResourceId: RESOURCE, label }) as CloudResourceEvidenceHubResponse;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  isJwtAuthMode.mockReturnValue(true);
  readSignedInUserSubject.mockReturnValue("principal-1");
  getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope());
});

afterEach(() => vi.restoreAllMocks());

describe("SecureNow resource-hub cache CACHE-01 through CACHE-03", () => {
  it("partitions by principal, tenant, workspace, project and evidence query scope", async () => {
    const { buildInfraEvidenceResourceHubCacheKey: key } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    const base = key(RESOURCE, { snapshotId: "snapshot-1", controlId: "control-1" });
    expect(key(RESOURCE, { snapshotId: "snapshot-1", controlId: "control-2" })).not.toBe(base);
    expect(key(RESOURCE, { snapshotId: "snapshot-2", controlId: "control-1" })).not.toBe(base);
    readSignedInUserSubject.mockReturnValue("principal-2");
    expect(key(RESOURCE, { snapshotId: "snapshot-1", controlId: "control-1" })).not.toBe(base);
    readSignedInUserSubject.mockReturnValue("principal-1");
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope("tenant-2"));
    expect(key(RESOURCE, { snapshotId: "snapshot-1", controlId: "control-1" })).not.toBe(base);
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope("tenant-1", "workspace-2"));
    expect(key(RESOURCE, { snapshotId: "snapshot-1", controlId: "control-1" })).not.toBe(base);
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope("tenant-1", "workspace-1", "project-2"));
    expect(key(RESOURCE, { snapshotId: "snapshot-1", controlId: "control-1" })).not.toBe(base);
  });

  it("coalesces identical fetches and reuses a bounded fresh result", async () => {
    const { fetchCachedInfraEvidenceResourceHub, buildInfraEvidenceResourceHubCacheKey,
      readCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    let resolve: ((value: CloudResourceEvidenceHubResponse) => void) | undefined;
    fetchCloudResourceEvidenceHub.mockReturnValueOnce(
      new Promise<CloudResourceEvidenceHubResponse>((r) => { resolve = r; }),
    );
    const first = fetchCachedInfraEvidenceResourceHub(RESOURCE, { snapshotId: "s1" });
    const second = fetchCachedInfraEvidenceResourceHub(RESOURCE, { snapshotId: "s1" });
    resolve?.(hub("fresh"));
    expect((await Promise.all([first, second])).map(x => (x as unknown as {label:string}).label))
      .toEqual(["fresh", "fresh"]);
    expect(readCachedInfraEvidenceResourceHub(buildInfraEvidenceResourceHubCacheKey(
      RESOURCE, { snapshotId: "s1" },
    ))).toEqual(hub("fresh"));
    await fetchCachedInfraEvidenceResourceHub(RESOURCE, { snapshotId: "s1" });
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(1);
  });

  it("bypasses all caching and coalescing when subject, scope or JWT identity is unresolved", async () => {
    const { fetchCachedInfraEvidenceResourceHub, buildInfraEvidenceResourceHubCacheKey,
      readCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    fetchCloudResourceEvidenceHub.mockResolvedValue(hub("server"));
    readSignedInUserSubject.mockReturnValue(null);
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(2);
    expect(readCachedInfraEvidenceResourceHub(buildInfraEvidenceResourceHubCacheKey(RESOURCE))).toBeNull();
    readSignedInUserSubject.mockReturnValue("principal-1");
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope("", "workspace-1", "project-1"));
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(3);
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope());
    isJwtAuthMode.mockReturnValue(false);
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(4);
  });

  it("clears prior cached entries on a principal or operator scope change", async () => {
    const { fetchCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    fetchCloudResourceEvidenceHub.mockResolvedValue(hub("data"));
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    readSignedInUserSubject.mockReturnValue("other-user");
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    readSignedInUserSubject.mockReturnValue("principal-1");
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    getEffectiveBrowserProxyScopeHeaders.mockReturnValue(scope("other-tenant"));
    await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(4);
  });

  it("evicts the least-recently-used entry after 64 distinct cached hubs", async () => {
    const { buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    for (let i = 0; i < 64; i += 1) {
      writeCachedInfraEvidenceResourceHub(buildInfraEvidenceResourceHubCacheKey(
        RESOURCE, { controlId: "control-" + i },
      ), hub(String(i)));
    }
    const oldest = buildInfraEvidenceResourceHubCacheKey(RESOURCE, { controlId: "control-0" });
    const second = buildInfraEvidenceResourceHubCacheKey(RESOURCE, { controlId: "control-1" });
    // Promote the oldest, so the second entry is evicted.
    expect(readCachedInfraEvidenceResourceHub(oldest)).not.toBeNull();
    writeCachedInfraEvidenceResourceHub(buildInfraEvidenceResourceHubCacheKey(
      RESOURCE, { controlId: "control-64" },
    ), hub("64"));
    expect(readCachedInfraEvidenceResourceHub(second)).toBeNull();
    expect(readCachedInfraEvidenceResourceHub(oldest)).not.toBeNull();
  });

  it("rejects oversized values and expires entries without relying on a timer", async () => {
    const { buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const key = buildInfraEvidenceResourceHubCacheKey(RESOURCE);
    writeCachedInfraEvidenceResourceHub(key, hub("x".repeat(300_000)));
    expect(readCachedInfraEvidenceResourceHub(key)).toBeNull();
    writeCachedInfraEvidenceResourceHub(key, hub("small"));
    now += 30_000;
    expect(readCachedInfraEvidenceResourceHub(key)).toBeNull();
  });

  it("invalidates all query scopes for a resource, but not another resource", async () => {
    const { buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub, invalidateInfraEvidenceResourceHubCacheForResource } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    const a = buildInfraEvidenceResourceHubCacheKey(RESOURCE, { snapshotId: "a" });
    const b = buildInfraEvidenceResourceHubCacheKey(RESOURCE, { snapshotId: "b" });
    const other = buildInfraEvidenceResourceHubCacheKey("resource-other");
    writeCachedInfraEvidenceResourceHub(a, hub("a"));
    writeCachedInfraEvidenceResourceHub(b, hub("b"));
    writeCachedInfraEvidenceResourceHub(other, hub("other"));
    invalidateInfraEvidenceResourceHubCacheForResource(RESOURCE.toUpperCase());
    expect(readCachedInfraEvidenceResourceHub(a)).toBeNull();
    expect(readCachedInfraEvidenceResourceHub(b)).toBeNull();
    expect(readCachedInfraEvidenceResourceHub(other)).toEqual(hub("other"));
  });

  it("an older completed request cannot remove a newer one after invalidation", async () => {
    const { fetchCachedInfraEvidenceResourceHub, invalidateInfraEvidenceResourceHubCache,
      buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    let resolveOld: ((value: CloudResourceEvidenceHubResponse) => void) | undefined;
    let resolveNew: ((value: CloudResourceEvidenceHubResponse) => void) | undefined;
    fetchCloudResourceEvidenceHub.mockImplementationOnce(
      () => new Promise<CloudResourceEvidenceHubResponse>((r) => { resolveOld = r; }),
    ).mockImplementationOnce(
      () => new Promise<CloudResourceEvidenceHubResponse>((r) => { resolveNew = r; }),
    );
    const oldRequest = fetchCachedInfraEvidenceResourceHub(RESOURCE, { snapshotId: "s1" });
    const key = buildInfraEvidenceResourceHubCacheKey(RESOURCE, { snapshotId: "s1" });
    invalidateInfraEvidenceResourceHubCache(key);
    const newRequest = fetchCachedInfraEvidenceResourceHub(RESOURCE, { snapshotId: "s1" });
    resolveOld?.(hub("obsolete"));
    await oldRequest;
    const coalesced = fetchCachedInfraEvidenceResourceHub(RESOURCE, { snapshotId: "s1" });
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(2);
    resolveNew?.(hub("fresh"));
    expect(await newRequest).toEqual(hub("fresh"));
    expect(await coalesced).toEqual(hub("fresh"));
    expect(readCachedInfraEvidenceResourceHub(key)).toEqual(hub("fresh"));
  });

  it("does not repopulate after resource invalidation or failed request", async () => {
    const { fetchCachedInfraEvidenceResourceHub, invalidateInfraEvidenceResourceHubCacheForResource,
      buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    let resolveOld: ((value: CloudResourceEvidenceHubResponse) => void) | undefined;
    fetchCloudResourceEvidenceHub.mockImplementationOnce(
      () => new Promise<CloudResourceEvidenceHubResponse>((r) => { resolveOld = r; }),
    ).mockRejectedValueOnce(new Error("server unavailable"));
    const old = fetchCachedInfraEvidenceResourceHub(RESOURCE);
    invalidateInfraEvidenceResourceHubCacheForResource(RESOURCE);
    resolveOld?.(hub("obsolete"));
    await old;
    expect(readCachedInfraEvidenceResourceHub(buildInfraEvidenceResourceHubCacheKey(RESOURCE))).toBeNull();
    await expect(fetchCachedInfraEvidenceResourceHub(RESOURCE)).rejects.toThrow("server unavailable");
    expect(readCachedInfraEvidenceResourceHub(buildInfraEvidenceResourceHubCacheKey(RESOURCE))).toBeNull();
  });
  it("bounds total approximate payload bytes even when under the 64-entry ceiling", async () => {
    const { buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    const large = hub("x".repeat(120_000)); // roughly 240 KiB per entry
    for (let i = 0; i < 22; i += 1) {
      writeCachedInfraEvidenceResourceHub(
        buildInfraEvidenceResourceHubCacheKey(RESOURCE, { controlId: "large-" + i }),
        large,
      );
    }
    expect(readCachedInfraEvidenceResourceHub(
      buildInfraEvidenceResourceHubCacheKey(RESOURCE, { controlId: "large-0" }),
    )).toBeNull();
    expect(readCachedInfraEvidenceResourceHub(
      buildInfraEvidenceResourceHubCacheKey(RESOURCE, { controlId: "large-21" }),
    )).not.toBeNull();
  });

  it("auth-session replacement purges same-subject cached evidence", async () => {
    const { buildInfraEvidenceResourceHubCacheKey, readCachedInfraEvidenceResourceHub,
      writeCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    const key = buildInfraEvidenceResourceHubCacheKey(RESOURCE);
    writeCachedInfraEvidenceResourceHub(key, hub("before-login"));
    window.dispatchEvent(new Event("archlucid:auth-context-changed"));
    expect(readCachedInfraEvidenceResourceHub(key)).toBeNull();
  });

  it("an in-flight response from a previous principal cannot populate the new principal cache", async () => {
    const { buildInfraEvidenceResourceHubCacheKey, fetchCachedInfraEvidenceResourceHub,
      readCachedInfraEvidenceResourceHub } =
      await import("@/lib/infra-evidence/infra-evidence-resource-hub-cache");
    let resolveOld: ((value: CloudResourceEvidenceHubResponse) => void) | undefined;
    fetchCloudResourceEvidenceHub.mockImplementationOnce(
      () => new Promise<CloudResourceEvidenceHubResponse>((r) => { resolveOld = r; }),
    ).mockResolvedValueOnce(hub("new-identity"));
    const old = fetchCachedInfraEvidenceResourceHub(RESOURCE);
    readSignedInUserSubject.mockReturnValue("principal-2");
    const newKey = buildInfraEvidenceResourceHubCacheKey(RESOURCE);
    const fresh = await fetchCachedInfraEvidenceResourceHub(RESOURCE);
    resolveOld?.(hub("old-identity"));
    await old;
    expect(fresh).toEqual(hub("new-identity"));
    expect(readCachedInfraEvidenceResourceHub(newKey)).toEqual(hub("new-identity"));
    expect(fetchCloudResourceEvidenceHub).toHaveBeenCalledTimes(2);
  });

});
