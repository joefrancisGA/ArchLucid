"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPilotRecentDeltas } from "@/lib/pilot-recent-deltas-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function usePilotRecentDeltasQuery(count: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: operatorQueryKeys.pilotRecentDeltas(count),
    queryFn: () => fetchPilotRecentDeltas(count),
    enabled: options?.enabled ?? true,
  });
}
