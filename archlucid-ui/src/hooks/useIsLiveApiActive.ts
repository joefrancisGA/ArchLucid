"use client";

import { useEffect, useState } from "react";

import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

const LIVE_API_CACHE_MS = 30_000;

let cachedLiveApi: boolean | null = null;
let cachedAtMs = 0;

async function resolveLiveApiActive(): Promise<boolean> {
  if (isStaticDemoPayloadFallbackEnabled()) {
    const health = await fetchHealthReadySummary();

    return health !== null;
  }

  const health = await fetchHealthReadySummary();

  return health !== null;
}

/** True when the API health endpoint responds; false when static fallback is the only path. */
export function useIsLiveApiActive(): boolean | null {
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();

    if (cachedLiveApi !== null && now - cachedAtMs < LIVE_API_CACHE_MS) {
      setIsLive(cachedLiveApi);

      return;
    }

    void resolveLiveApiActive().then((live) => {
      if (cancelled) {
        return;
      }

      cachedLiveApi = live;
      cachedAtMs = Date.now();
      setIsLive(live);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return isLive;
}
