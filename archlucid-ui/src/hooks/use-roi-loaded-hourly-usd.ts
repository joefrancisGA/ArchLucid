"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_LOADED_HOURLY_USD } from "@/lib/roi-assumptions";
import {
  persistRoiLoadedHourlyUsd,
  readRoiLoadedHourlyUsdFromStorage,
  syncRoiLoadedHourlyUsdFromServer,
} from "@/lib/roi-loaded-hourly-preference";

export function useRoiLoadedHourlyUsd(): {
  readonly hourlyUsd: number;
  readonly mounted: boolean;
  readonly isDefaultRate: boolean;
  readonly setHourlyUsd: (next: number) => void;
} {
  const [hourlyUsd, setHourlyUsdState] = useState<number>(() => readRoiLoadedHourlyUsdFromStorage());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHourlyUsdState(readRoiLoadedHourlyUsdFromStorage());

    void syncRoiLoadedHourlyUsdFromServer().then((synced) => {
      if (synced !== null) {
        setHourlyUsdState(synced);
      }
    });
  }, []);

  const setHourlyUsd = useCallback((next: number) => {
    setHourlyUsdState(next);
    void persistRoiLoadedHourlyUsd(next);
  }, []);

  return {
    hourlyUsd,
    mounted,
    isDefaultRate: Math.abs(hourlyUsd - DEFAULT_LOADED_HOURLY_USD) < 1e-6,
    setHourlyUsd,
  };
}
