"use client";

import { useQuery } from "@tanstack/react-query";

import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

export function useAskProjectRunsQuery(
  projectId = "default",
  options?: { readonly committedOnly?: boolean; readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: [...operatorQueryKeys.askProjectRuns(projectId), options?.committedOnly ?? false] as const,
    queryFn: () =>
      loadProjectRunsMergedWithDemoFallback(projectId, {
        committedOnly: options?.committedOnly ?? false,
      }),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
