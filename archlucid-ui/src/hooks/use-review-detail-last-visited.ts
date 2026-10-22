"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { ReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";
import {
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import {
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
  reviewTabWatermarkKey,
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
  readonly markTabSeen: (tabId: ReviewDetailTabId) => void;
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

  const markTabSeen = useCallback(
    (tabId: ReviewDetailTabId): void => {
      markLastVisitedNow(reviewTabWatermarkKey(runId, tabId), tabActivityAt[tabId] ?? null);
      emitWatermarkChange();
    },
    [runId, tabActivityAt],
  );

  return {
    isTabNewSinceLastVisit,
    markTabSeen,
  };
}
