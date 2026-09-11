"use client";

import { useQuery } from "@tanstack/react-query";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";
import { shouldSkipArchitectureOnlyProxyApi } from "@/lib/product-line/architecture-only-proxy-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

type AskProjectRunsQueryOptions = {
  readonly committedOnly?: boolean;
  readonly forCompare?: boolean;
  readonly mergeDemoOnEmpty?: boolean;
  readonly enabled?: boolean;
};

export function useAskProjectRunsQuery(
  projectId = "default",
  options?: AskProjectRunsQueryOptions,
) {
  const { productLine } = useProductLine();
  const committedOnly = options?.committedOnly ?? false;
  const forCompare = options?.forCompare ?? false;
  const mergeDemoOnEmpty = options?.mergeDemoOnEmpty ?? false;
  const skipArchitectureOnlyApi = shouldSkipArchitectureOnlyProxyApi(productLine);

  return useQuery({
    queryKey: [...operatorQueryKeys.askProjectRuns(projectId), committedOnly, forCompare, mergeDemoOnEmpty] as const,
    queryFn: () =>
      loadProjectRunsMergedWithDemoFallback(projectId, {
        committedOnly,
        forCompare,
        mergeDemoOnEmpty,
      }),
    enabled: (options?.enabled ?? true) && !skipArchitectureOnlyApi,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
