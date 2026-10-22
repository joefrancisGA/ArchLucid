"use client";

import { useEffect, useState } from "react";

let relativeFreshnessNowMs = Date.now();

function bumpRelativeFreshnessNowMs(): void {
  relativeFreshnessNowMs = Date.now();
}

function getRelativeFreshnessNowMsSnapshot(): number {
  return relativeFreshnessNowMs;
}

/** Recomputes relative freshness labels after tab focus and once per minute (SEA P1). */
export function useOperatorRelativeFreshnessNowMs(): number {
  const [nowMs, setNowMs] = useState(getRelativeFreshnessNowMsSnapshot);

  useEffect(() => {
    const bump = (): void => {
      bumpRelativeFreshnessNowMs();
      setNowMs(getRelativeFreshnessNowMsSnapshot());
    };

    const intervalId = window.setInterval(bump, 60_000);
    document.addEventListener("visibilitychange", bump);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", bump);
    };
  }, []);

  return nowMs;
}
