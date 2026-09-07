import { fetchCloudResourceEvidenceHub } from "@/lib/infra-evidence/infra-evidence-hub-api";
import type { CloudResourceEvidenceHubResponse, ResourceHubQueryContext } from "@/lib/infra-evidence/infra-evidence-hub-types";

const HUB_CACHE_TTL_MS = 30_000;

type HubCacheEntry = {
  readonly hub: CloudResourceEvidenceHubResponse;
  readonly fetchedAtMs: number;
};

type HubQueryCacheIdentity = Partial<ResourceHubQueryContext>;

const hubCache = new Map<string, HubCacheEntry>();
const inflightHubFetches = new Map<string, Promise<CloudResourceEvidenceHubResponse>>();
const cacheGenerations = new Map<string, number>();

function normalizeCacheSegment(value?: string | null): string {
  return value?.trim() ?? "";
}

export function buildInfraEvidenceResourceHubCacheKey(
  cloudResourceId: string,
  context: HubQueryCacheIdentity = {},
): string {
  const trimmedResourceId = cloudResourceId.trim();

  return [
    trimmedResourceId,
    normalizeCacheSegment(context.snapshotId),
    normalizeCacheSegment(context.runId),
    normalizeCacheSegment(context.assessmentId),
    normalizeCacheSegment(context.auditEvidenceSnapshotId),
    normalizeCacheSegment(context.controlId),
  ].join(":");
}

function getCacheGeneration(cacheKey: string): number {
  return cacheGenerations.get(cacheKey) ?? 0;
}

function bumpCacheGeneration(cacheKey: string): void {
  cacheGenerations.set(cacheKey, getCacheGeneration(cacheKey) + 1);
}

function bumpCacheGenerationsMatching(matcher: (cacheKey: string) => boolean): void {
  const keys = new Set<string>([
    ...hubCache.keys(),
    ...inflightHubFetches.keys(),
    ...cacheGenerations.keys(),
  ]);

  for (const cacheKey of keys) {
    if (matcher(cacheKey)) {
      bumpCacheGeneration(cacheKey);
      hubCache.delete(cacheKey);
      inflightHubFetches.delete(cacheKey);
    }
  }
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
    bumpCacheGenerationsMatching(() => true);

    return;
  }

  bumpCacheGeneration(cacheKey);
  hubCache.delete(cacheKey);
  inflightHubFetches.delete(cacheKey);
}

export function invalidateInfraEvidenceResourceHubCacheForResource(cloudResourceId: string): void {
  const trimmedResourceId = cloudResourceId.trim();

  if (trimmedResourceId.length === 0) {
    return;
  }

  const prefix = `${trimmedResourceId}:`;

  bumpCacheGenerationsMatching((cacheKey) => cacheKey === trimmedResourceId || cacheKey.startsWith(prefix));
}

export async function fetchCachedInfraEvidenceResourceHub(
  cloudResourceId: string,
  options: HubQueryCacheIdentity = {},
): Promise<CloudResourceEvidenceHubResponse> {
  const cacheKey = buildInfraEvidenceResourceHubCacheKey(cloudResourceId, options);
  const cachedHub = readCachedInfraEvidenceResourceHub(cacheKey);

  if (cachedHub != null) {
    return cachedHub;
  }

  const inflight = inflightHubFetches.get(cacheKey);

  if (inflight != null) {
    return inflight;
  }

  const fetchGeneration = getCacheGeneration(cacheKey);
  const fetchPromise = fetchCloudResourceEvidenceHub(cloudResourceId, options)
    .then((hub) => {
      if (getCacheGeneration(cacheKey) === fetchGeneration) {
        writeCachedInfraEvidenceResourceHub(cacheKey, hub);
      }

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
