import { fetchCloudResourceEvidenceHub } from "@/lib/infra-evidence/infra-evidence-hub-api";
import type { CloudResourceEvidenceHubResponse, ResourceHubQueryContext } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { readSignedInUserSubject } from "@/lib/oidc/session";

const HUB_CACHE_TTL_MS = 30_000;
const HUB_CACHE_MAX_ENTRIES = 64;
const HUB_CACHE_MAX_ESTIMATED_BYTES = 4 * 1024 * 1024;
const HUB_CACHE_MAX_ENTRY_ESTIMATED_BYTES = 512 * 1024;
const HUB_CACHE_MAX_INFLIGHT = 64;
const CACHE_KEY_VERSION = "securenow-hub-v2";

type HubCacheEntry = {
  readonly hub: CloudResourceEvidenceHubResponse;
  readonly fetchedAtMs: number;
  readonly estimatedBytes: number;
};

type HubQueryCacheIdentity = Partial<ResourceHubQueryContext>;
type CachePartition = readonly [string, string, string, string];

const hubCache = new Map<string, HubCacheEntry>();
const inflightHubFetches = new Map<string, Promise<CloudResourceEvidenceHubResponse>>();
let cacheEstimatedBytes = 0;
let lastPartition: string | null = null;

// Drop cached privileged data on OIDC session transitions, including same-subject re-login.
if (typeof window !== "undefined") {
  window.addEventListener("archlucid:auth-context-changed", () => {
    hubCache.clear();
    cacheEstimatedBytes = 0;
    inflightHubFetches.clear();
    lastPartition = null;
  });
}

function normalizeCacheSegment(value?: string | null): string {
  return value?.trim() ?? "";
}

/**
 * The browser cache is only enabled when we know the authenticated JWT subject
 * and the exact proxy tenant/workspace/project scope. Opaque API-key sessions and
 * unresolved identities always fetch from the server rather than share a browser cache.
 * This is a UI optimization, never an authorization decision.
 */
function resolvePartition(): CachePartition | null {
  if (typeof window === "undefined" || !isJwtAuthMode()) {
    return null;
  }

  const subject = normalizeCacheSegment(readSignedInUserSubject());
  const scope = getEffectiveBrowserProxyScopeHeaders();
  const tenantId = normalizeCacheSegment(scope["x-tenant-id"]).toLowerCase();
  const workspaceId = normalizeCacheSegment(scope["x-workspace-id"]).toLowerCase();
  const projectId = normalizeCacheSegment(scope["x-project-id"]).toLowerCase();

  return subject && tenantId && workspaceId && projectId
    ? [tenantId, workspaceId, projectId, subject]
    : null;
}

function clearEntries(): void {
  hubCache.clear();
  cacheEstimatedBytes = 0;
  inflightHubFetches.clear();
}

/** A scope or authenticated-subject change immediately invalidates all prior entries. */
function currentPartition(): string | null {
  const partition = resolvePartition();
  const identity = partition === null ? null : JSON.stringify(partition);
  if (identity !== lastPartition) {
    clearEntries();
    lastPartition = identity;
  }
  return identity;
}

function keyFor(identity: string, cloudResourceId: string, context: HubQueryCacheIdentity): string {
  return JSON.stringify([
    CACHE_KEY_VERSION,
    identity,
    cloudResourceId.trim().toLowerCase(),
    normalizeCacheSegment(context.snapshotId),
    normalizeCacheSegment(context.runId),
    normalizeCacheSegment(context.assessmentId),
    normalizeCacheSegment(context.auditEvidenceSnapshotId),
    normalizeCacheSegment(context.controlId),
  ]);
}

function cacheKeyResourceId(cacheKey: string): string | null {
  try {
    const parts: unknown = JSON.parse(cacheKey);
    return Array.isArray(parts) && parts[0] === CACHE_KEY_VERSION && typeof parts[2] === "string"
      ? parts[2]
      : null;
  } catch {
    return null;
  }
}

/** Cache identity includes authenticated subject, project scope and all hub query options. */
export function buildInfraEvidenceResourceHubCacheKey(
  cloudResourceId: string,
  context: HubQueryCacheIdentity = {},
): string {
  return keyFor(currentPartition() ?? "UNRESOLVED_NO_REUSE", cloudResourceId, context);
}

function deleteEntry(cacheKey: string): void {
  const entry = hubCache.get(cacheKey);
  if (entry !== undefined) {
    cacheEstimatedBytes -= entry.estimatedBytes;
    hubCache.delete(cacheKey);
  }
}

function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of hubCache) {
    if (now - entry.fetchedAtMs >= HUB_CACHE_TTL_MS) {
      deleteEntry(key);
    }
  }
}

function estimateEntryBytes(hub: CloudResourceEvidenceHubResponse): number {
  try {
    // Conservative serialized UTF-16 approximation, not an actual JS heap measurement.
    const encoded = JSON.stringify(hub);
    return typeof encoded === "string" ? encoded.length * 2 : Infinity;
  } catch {
    return Infinity;
  }
}

export function readCachedInfraEvidenceResourceHub(
  cacheKey: string,
): CloudResourceEvidenceHubResponse | null {
  const identity = currentPartition();
  if (identity === null || !cacheKey.startsWith(JSON.stringify([CACHE_KEY_VERSION, identity]).slice(0, -1) + ",")) {
    return null;
  }

  pruneExpiredEntries();
  const entry = hubCache.get(cacheKey);
  if (entry === undefined) {
    return null;
  }
  // Map insertion order is our LRU: promote the entry on a hit.
  hubCache.delete(cacheKey);
  hubCache.set(cacheKey, entry);
  return entry.hub;
}

export function writeCachedInfraEvidenceResourceHub(
  cacheKey: string,
  hub: CloudResourceEvidenceHubResponse,
): void {
  const identity = currentPartition();
  if (identity === null || !cacheKey.startsWith(JSON.stringify([CACHE_KEY_VERSION, identity]).slice(0, -1) + ",")) {
    return;
  }
  pruneExpiredEntries();
  const estimatedBytes = estimateEntryBytes(hub);
  if (estimatedBytes > HUB_CACHE_MAX_ENTRY_ESTIMATED_BYTES) {
    deleteEntry(cacheKey);
    return;
  }

  deleteEntry(cacheKey);
  while (hubCache.size >= HUB_CACHE_MAX_ENTRIES ||
         cacheEstimatedBytes + estimatedBytes > HUB_CACHE_MAX_ESTIMATED_BYTES) {
    const oldest = hubCache.keys().next().value;
    if (oldest === undefined) {
      return;
    }
    deleteEntry(oldest);
  }

  hubCache.set(cacheKey, { hub, fetchedAtMs: Date.now(), estimatedBytes });
  cacheEstimatedBytes += estimatedBytes;
}

function invalidateMatching(matcher: (cacheKey: string) => boolean): void {
  for (const key of [...new Set([...hubCache.keys(), ...inflightHubFetches.keys()])]) {
    if (matcher(key)) {
      deleteEntry(key);
      // An old promise remains deliverable to its original consumer but cannot
      // repopulate this cache or remove a newer post-invalidation request.
      inflightHubFetches.delete(key);
    }
  }
}

export function invalidateInfraEvidenceResourceHubCache(cacheKey?: string): void {
  if (cacheKey === undefined) {
    clearEntries();
    return;
  }
  invalidateMatching((key) => key === cacheKey);
}

export function invalidateInfraEvidenceResourceHubCacheForResource(cloudResourceId: string): void {
  const target = cloudResourceId.trim().toLowerCase();
  if (!target) {
    return;
  }
  invalidateMatching((key) => cacheKeyResourceId(key) === target);
}

export async function fetchCachedInfraEvidenceResourceHub(
  cloudResourceId: string,
  options: HubQueryCacheIdentity = {},
): Promise<CloudResourceEvidenceHubResponse> {
  const identity = currentPartition();
  // Without a trustworthy principal and scope, bypass both cache and coalescing.
  if (identity === null) {
    return fetchCloudResourceEvidenceHub(cloudResourceId, options);
  }
  const cacheKey = keyFor(identity, cloudResourceId, options);
  const cached = readCachedInfraEvidenceResourceHub(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const inflight = inflightHubFetches.get(cacheKey);
  if (inflight !== undefined) {
    return inflight;
  }
  if (inflightHubFetches.size >= HUB_CACHE_MAX_INFLIGHT) {
    return fetchCloudResourceEvidenceHub(cloudResourceId, options);
  }

  const fetchPromise = fetchCloudResourceEvidenceHub(cloudResourceId, options)
    .then((hub) => {
      if (inflightHubFetches.get(cacheKey) === fetchPromise && currentPartition() === identity) {
        writeCachedInfraEvidenceResourceHub(cacheKey, hub);
      }
      return hub;
    })
    .finally(() => {
      if (inflightHubFetches.get(cacheKey) === fetchPromise) {
        inflightHubFetches.delete(cacheKey);
      }
    });
  inflightHubFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}
