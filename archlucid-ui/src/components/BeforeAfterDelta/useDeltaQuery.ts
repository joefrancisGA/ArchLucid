"use client";

import { useMemo } from "react";

import { usePilotRecentDeltasQuery } from "@/hooks/use-pilot-recent-deltas-query";

import type { RecentPilotRunDeltasPayload } from "./types";

/**
 * Shared loader for the `BeforeAfterDeltaPanel` top / sidebar / inline variants.
 *
 * Centralises three things so each variant component is presentation-only:
 *  1. The `/api/proxy/v1/pilots/runs/recent-deltas` URL shape and `count` query param.
 *  2. The JWT-vs-registration-scope header dance via `mergeRegistrationScopeForProxy`.
 *  3. The "loading | ready | error" state machine backed by TanStack Query (TB-562).
 *
 * Returns `data === null` when the panel should render nothing (loading, error,
 * or zero committed runs) — the variants treat the three terminal states the same
 * way so a partial outage degrades gracefully to "panel hidden", never broken UI.
 */
export type DeltaQueryState = {
  status: "loading" | "ready" | "error";
  data: RecentPilotRunDeltasPayload | null;
};

export type UseDeltaQueryOptions = {
  /** Number of most recent committed runs to aggregate over. Server clamps to [1, 25]. */
  count: number;
};

export function useDeltaQuery({ count }: UseDeltaQueryOptions): DeltaQueryState {
  const query = usePilotRecentDeltasQuery(count);

  return useMemo((): DeltaQueryState => {
    if (query.isPending) {
      return { status: "loading", data: null };
    }

    if (query.isError || query.data === null) {
      return { status: "error", data: null };
    }

    return { status: "ready", data: query.data };
  }, [query.isPending, query.isError, query.data]);
}
