"use client";

import { useCallback, useEffect, useState } from "react";

import {
  archivedReviewsClientCacheKey,
  addArchivedReviewToClientCache,
  listArchivedReviewsClientCache,
} from "@/lib/archived-reviews-client-cache";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { RunSummary } from "@/types/authority";

export const ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT =
  "archlucid:archived-reviews-client-cache-changed";

/** Shared archived-review cache for hub inventory (browser-local until list API includes archived rows). */
export function useArchivedReviewsClientCache(): {
  readonly archivedRuns: RunSummary[];
  readonly rememberArchivedRun: (run: RunSummary) => void;
} {
  const cacheKey = archivedReviewsClientCacheKey(useOperatorScopeQueryKey());
  const [cached, setCached] = useState<{ key: string | null; runs: RunSummary[] }>({
    key: null,
    runs: [],
  });

  useEffect(() => {
    const refresh = (): void => {
      setCached({ key: cacheKey, runs: listArchivedReviewsClientCache(cacheKey) });
    };

    refresh();

    const onStorage = (event: StorageEvent): void => {
      if (event.key === cacheKey || event.key === null) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT, refresh);
    };
  }, [cacheKey]);

  const rememberArchivedRun = useCallback((run: RunSummary) => {
    const next = addArchivedReviewToClientCache(run, cacheKey);

    setCached({ key: cacheKey, runs: next });
    window.dispatchEvent(new Event(ARCHIVED_REVIEWS_CLIENT_CACHE_CHANGED_EVENT));
  }, [cacheKey]);

  return { archivedRuns: cached.key === cacheKey ? cached.runs : [], rememberArchivedRun };
}
