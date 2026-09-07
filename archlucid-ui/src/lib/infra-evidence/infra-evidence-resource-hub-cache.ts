import { fetchCloudResourceEvidenceHub } from "@/lib/infra-evidence/infra-evidence-hub-api";
import type { CloudResourceEvidenceHubResponse, ResourceHubQueryContext } from "@/lib/infra-evidence/infra-evidence-hub-types";

const HUB_CACHE_TTL_MS = 30_000;

type HubCacheEntry = {
  readonly hub: CloudResourceEvidenceHubResponse;
  readonly fetchedAtMs: number;
};

const hubCache = new Map<string, HubCacheEntry>();
const inflightHubFetches = new Map<string, Promise<CloudResourceEvidenceHubResponse>>();

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
    inflightHubFetches.clear();

    return;
  }

  hubCache.delete(cacheKey);
  inflightHubFetches.delete(cacheKey);
}

export function invalidateInfraEvidenceResourceHubCacheForResource(cloudResourceId: string): void {
  const trimmedResourceId = cloudResourceId.trim();

  if (trimmedResourceId.length === 0) {
    return;
  }

  const prefix = `${trimmedResourceId}:`;

  for (const key of hubCache.keys()) {
    if (key === trimmedResourceId || key.startsWith(prefix)) {
      hubCache.delete(key);
    }
  }

  for (const key of inflightHubFetches.keys()) {
    if (key === trimmedResourceId || key.startsWith(prefix)) {
      inflightHubFetches.delete(key);
    }
  }
}

export async function fetchCachedInfraEvidenceResourceHub(
  cloudResourceId: string,
  options: Partial<ResourceHubQueryContext> = {},
): Promise<CloudResourceEvidenceHubResponse> {
  const cacheKey = buildInfraEvidenceResourceHubCacheKey(cloudResourceId, options.snapshotId);
  const cachedHub = readCachedInfraEvidenceResourceHub(cacheKey);

  if (cachedHub != null) {
    return cachedHub;
  }

  const inflight = inflightHubFetches.get(cacheKey);

  if (inflight != null) {
    return inflight;
  }

  const fetchPromise = fetchCloudResourceEvidenceHub(cloudResourceId, options)
    .then((hub) => {
      writeCachedInfraEvidenceResourceHub(cacheKey, hub);
      inflightHubFetches.delete(cacheKey);

      return hub;
    })
    .catch((error: unknown) => {
      inflightHubFetches.delete(cacheKey);

      throw error;
    });

  inflightHubFetches.set(cacheKey, fetchPromise);

  return fetchPromise;
}
