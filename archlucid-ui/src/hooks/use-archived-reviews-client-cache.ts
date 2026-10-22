"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ARCHIVED_REVIEWS_CLIENT_CACHE_KEY,
  addArchivedReviewToClientCache,
  listArchivedReviewsClientCache,
} from "@/lib/archived-reviews-client-cache";
import type { RunSummary } from "@/types/authority";

export const ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT =
  "archlucid:archived-reviews-client-cache-changed";

/** Shared archived-review cache for hub inventory (browser-local until list API includes archived rows). */
export function useArchivedReviewsClientCache(): {
  readonly archivedRuns: RunSummary[];
  readonly rememberArchivedRun: (run: RunSummary) => void;
} {
  const [archivedRuns, setArchivedRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    setArchivedRuns(listArchivedReviewsClientCache());

    const refresh = (): void => {
      setArchivedRuns(listArchivedReviewsClientCache());
    };

    const onStorage = (event: StorageEvent): void => {
      if (event.key === ARCHIVED_REVIEWS_CLIENT_CACHE_KEY) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT, refresh);
    };
  }, []);

  const rememberArchivedRun = useCallback((run: RunSummary) => {
    const next = addArchivedReviewToClientCache(run);

    setArchivedRuns(next);
    window.dispatchEvent(new Event(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT));
  }, []);

  return { archivedRuns, rememberArchivedRun };
}
