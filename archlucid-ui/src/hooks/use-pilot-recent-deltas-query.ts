"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { fetchPilotRecentDeltas } from "@/lib/pilot-recent-deltas-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function usePilotRecentDeltasQuery(count: number, options?: { enabled?: boolean }) {
  const scope = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operatorQueryKeys.pilotRecentDeltas(scope, count),
    queryFn: () => fetchPilotRecentDeltas(count),
    enabled: options?.enabled ?? true,
  });
}
