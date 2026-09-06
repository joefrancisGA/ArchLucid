import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

const HUB_CACHE_TTL_MS = 30_000;

type HubCacheEntry = {
  readonly hub: CloudResourceEvidenceHubResponse;
  readonly fetchedAtMs: number;
};

const hubCache = new Map<string, HubCacheEntry>();

export function buildInfraEvidenceResourceHubCacheKey(
  cloudResourceId: string,
  snapshotId?: string | null,
): string {
  const trimmedResourceId = cloudResourceId.trim();
  const trimmedSnapshotId = snapshotId?.trim() ?? "";

  return `${trimmedResourceId}:${trimmedSnapshotId}`;
}

export function readCachedInfraEvidenceResourceHub(
  cacheKey: string,
): CloudResourceEvidenceHubResponse | null {
  const entry = hubCache.get(cacheKey);

  if (entry == null) {
    return null;
  }

  if (Date.now() - entry.fetchedAtMs > HUB_CACHE_TTL_MS) {
    hubCache.delete(cacheKey);

    return null;
  }

  return entry.hub;
}

export function writeCachedInfraEvidenceResourceHub(
  cacheKey: string,
  hub: CloudResourceEvidenceHubResponse,
): void {
  hubCache.set(cacheKey, {
    hub,
    fetchedAtMs: Date.now(),
  });
}

export function invalidateInfraEvidenceResourceHubCache(cacheKey?: string): void {
  if (cacheKey == null) {
    hubCache.clear();

    return;
  }

  hubCache.delete(cacheKey);
}
