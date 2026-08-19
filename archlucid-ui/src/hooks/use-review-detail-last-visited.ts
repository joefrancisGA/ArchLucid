"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  REVIEW_DETAIL_TAB_IDS,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import {
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
  readLastVisitedWatermark,
  reviewTabWatermarkKey,
  writeLastVisitedWatermark,
} from "@/lib/usability/last-visited-watermark";

const watermarkListeners = new Set<() => void>();
let watermarkVersion = 0;

function emitWatermarkChange(): void {
  watermarkVersion += 1;

  for (const listener of watermarkListeners) {
    listener();
  }
}

function subscribeWatermarkStore(listener: () => void): () => void {
  watermarkListeners.add(listener);

  return () => {
    watermarkListeners.delete(listener);
  };
}

function getWatermarkSnapshotVersion(): number {
  return watermarkVersion;
}

export type UseReviewDetailLastVisitedResult = {
  readonly isTabNewSinceLastVisit: (tabId: ReviewDetailTabId) => boolean;
  readonly hasAnyNewSinceLastVisit: boolean;
  readonly markTabSeen: (tabId: ReviewDetailTabId) => void;
  readonly markAllTabsSeen: () => void;
};

export function useReviewDetailLastVisited(
  runId: string,
  tabActivityAt: ReviewDetailTabActivityAt,
): UseReviewDetailLastVisitedResult {
  useSyncExternalStore(subscribeWatermarkStore, getWatermarkSnapshotVersion, () => 0);

  const isTabNewSinceLastVisit = useCallback(
    (tabId: ReviewDetailTabId): boolean => {
      const activityAt = tabActivityAt[tabId] ?? null;

      return isActivityNewSinceLastVisit(reviewTabWatermarkKey(runId, tabId), activityAt);
    },
    [runId, tabActivityAt],
  );

  const hasAnyNewSinceLastVisit = useMemo(
    () => REVIEW_DETAIL_TAB_IDS.some((tabId) => isTabNewSinceLastVisit(tabId)),
    [isTabNewSinceLastVisit],
  );

  const markTabSeen = useCallback(
    (tabId: ReviewDetailTabId): void => {
      markLastVisitedNow(reviewTabWatermarkKey(runId, tabId), tabActivityAt[tabId] ?? null);
      emitWatermarkChange();
    },
    [runId, tabActivityAt],
  );

  const markAllTabsSeen = useCallback((): void => {
    for (const tabId of REVIEW_DETAIL_TAB_IDS) {
      const key = reviewTabWatermarkKey(runId, tabId);
      const activityAt = tabActivityAt[tabId] ?? null;
      const existing = readLastVisitedWatermark(key);
      const nextSeenAt = resolveLatestSeenAt(existing, activityAt);

      writeLastVisitedWatermark(key, nextSeenAt);
    }

    emitWatermarkChange();
  }, [runId, tabActivityAt]);

  return {
    isTabNewSinceLastVisit,
    hasAnyNewSinceLastVisit,
    markTabSeen,
    markAllTabsSeen,
  };
}

function resolveLatestSeenAt(existing: string | null, activityAt: string | null): string {
  const candidates = [existing, activityAt, new Date().toISOString()].filter(
    (value): value is string => value !== null && value.trim().length > 0,
  );

  let latestMs = 0;
  let latestIso = new Date().toISOString();

  for (const candidate of candidates) {
    const parsed = Date.parse(candidate);

    if (!Number.isNaN(parsed) && parsed >= latestMs) {
      latestMs = parsed;
      latestIso = candidate;
    }
  }

  return latestIso;
}
