"use client";

import { useQuery } from "@tanstack/react-query";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { fetchPilotRecentDeltas } from "@/lib/pilot-recent-deltas-client";
import { shouldSkipArchitectureOnlyProxyApi } from "@/lib/product-line/architecture-only-proxy-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function usePilotRecentDeltasQuery(count: number, options?: { enabled?: boolean }) {
  const { productLine } = useProductLine();
  const scope = useOperatorScopeQueryKey();
  const skipArchitectureOnlyApi = shouldSkipArchitectureOnlyProxyApi(productLine);

  return useQuery({
    queryKey: operatorQueryKeys.pilotRecentDeltas(scope, count),
    queryFn: () => fetchPilotRecentDeltas(count),
    enabled: (options?.enabled ?? true) && !skipArchitectureOnlyApi,
  });
}
