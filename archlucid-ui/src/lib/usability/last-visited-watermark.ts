import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

const STORAGE_PREFIX = "archlucid:last-visited:v1:";

export type ReviewTabWatermarkKey = `review-tab:${string}:${ReviewDetailTabId}`;
export type ReviewFindingWatermarkKey = `review-finding:${string}:${string}`;
export type GovernanceQueueRowWatermarkKey = `governance-row:${string}:${string}`;
export type ColdSharedLinkUnpackWatermarkKey = `cold-unpack:${string}`;

export type LastVisitedWatermarkKey =
  | ReviewTabWatermarkKey
  | ReviewFindingWatermarkKey
  | GovernanceQueueRowWatermarkKey
  | ColdSharedLinkUnpackWatermarkKey;

export function reviewTabWatermarkKey(runId: string, tabId: ReviewDetailTabId): ReviewTabWatermarkKey {
  return `review-tab:${runId.trim()}:${tabId}`;
}

export function reviewFindingWatermarkKey(runId: string, findingId: string): ReviewFindingWatermarkKey {
  return `review-finding:${runId.trim()}:${findingId.trim()}`;
}

export function governanceQueueRowWatermarkKey(runId: string, findingId: string): GovernanceQueueRowWatermarkKey {
  return `governance-row:${runId.trim()}:${findingId.trim()}`;
}

export function coldSharedLinkUnpackWatermarkKey(runId: string): ColdSharedLinkUnpackWatermarkKey {
  return `cold-unpack:${runId.trim()}`;
}

export function hasColdSharedLinkUnpackWatermark(runId: string): boolean {
  return readLastVisitedWatermark(coldSharedLinkUnpackWatermarkKey(runId)) !== null;
}

export function markColdSharedLinkUnpackSeen(runId: string): void {
  markLastVisitedNow(coldSharedLinkUnpackWatermarkKey(runId));
}

function storageKey(key: LastVisitedWatermarkKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function readLastVisitedWatermark(key: LastVisitedWatermarkKey): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(key));

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    return raw.trim();
  } catch {
    return null;
  }
}

export function writeLastVisitedWatermark(key: LastVisitedWatermarkKey, seenAtUtc: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = seenAtUtc.trim();

  if (normalized.length === 0) {
    return;
  }

  try {
    // codeql[js/clear-text-storage-of-sensitive-data]: stores UTC activity watermarks only; keys scope UX dots, not credentials (TB-2150).
    window.localStorage.setItem(storageKey(key), normalized);
  } catch {
    /* private mode */
  }
}

function parseUtcMillis(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/** True when activity is strictly newer than the stored watermark (TB-2150). */
export function isActivityNewSinceLastVisit(
  key: LastVisitedWatermarkKey,
  activityAtUtc: string | null | undefined,
): boolean {
  const activityMs = parseUtcMillis(activityAtUtc);

  if (activityMs === null) {
    return false;
  }

  const watermarkMs = parseUtcMillis(readLastVisitedWatermark(key));

  if (watermarkMs === null) {
    return true;
  }

  return activityMs > watermarkMs;
}

export function markLastVisitedNow(key: LastVisitedWatermarkKey, activityAtUtc?: string | null): void {
  const seenAt =
    activityAtUtc !== null && activityAtUtc !== undefined && activityAtUtc.trim().length > 0
      ? activityAtUtc.trim()
      : new Date().toISOString();

  writeLastVisitedWatermark(key, seenAt);
}
