"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getItsmFindingCorrelationsSnapshot,
  requestItsmFindingCorrelations,
  subscribeItsmFindingCorrelations,
  type ItsmFindingCorrelationsEntry,
} from "@/lib/itsm-finding-correlations-store";

export type UseItsmFindingCorrelationsOptions = {
  readonly enabled?: boolean;
};

const EMPTY_ENTRY: ItsmFindingCorrelationsEntry = {
  correlations: [],
  loaded: false,
  error: false,
};

/** Subscribes to batched ITSM finding correlations for one finding id. */
export function useItsmFindingCorrelations(
  findingId: string,
  options: UseItsmFindingCorrelationsOptions = {},
): ItsmFindingCorrelationsEntry {
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled || findingId.trim().length === 0) {
      return;
    }

    requestItsmFindingCorrelations([findingId]);
  }, [enabled, findingId]);

  return useSyncExternalStore(
    subscribeItsmFindingCorrelations,
    () => (findingId.trim().length === 0 ? EMPTY_ENTRY : getItsmFindingCorrelationsSnapshot(findingId)),
    () => EMPTY_ENTRY,
  );
}

/** Prefetches correlations for many findings in one batched API call. */
export function usePrefetchItsmFindingCorrelations(
  findingIds: readonly string[],
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled || findingIds.length === 0) {
      return;
    }

    requestItsmFindingCorrelations(findingIds);
  }, [enabled, findingIds]);
}
