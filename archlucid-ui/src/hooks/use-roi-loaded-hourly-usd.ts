"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_LOADED_HOURLY_USD,
  ROI_HOURLY_USD_STORAGE_KEY,
  readStoredHourlyUsd,
} from "@/lib/roi-assumptions";

export function useRoiLoadedHourlyUsd(): {
  readonly hourlyUsd: number;
  readonly mounted: boolean;
  readonly isDefaultRate: boolean;
  readonly setHourlyUsd: (next: number) => void;
} {
  const [hourlyUsd, setHourlyUsdState] = useState<number>(DEFAULT_LOADED_HOURLY_USD);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHourlyUsdState(readStoredHourlyUsd());
  }, []);

  function setHourlyUsd(next: number): void {
    setHourlyUsdState(next);

    try {
      window.localStorage.setItem(ROI_HOURLY_USD_STORAGE_KEY, String(next));
    } catch {
      /* private mode */
    }
  }

  return {
    hourlyUsd,
    mounted,
    isDefaultRate: Math.abs(hourlyUsd - DEFAULT_LOADED_HOURLY_USD) < 1e-6,
    setHourlyUsd,
  };
}
