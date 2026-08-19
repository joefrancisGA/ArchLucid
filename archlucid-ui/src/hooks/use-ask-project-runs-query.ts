"use client";

import { useQuery } from "@tanstack/react-query";

import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";
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
  const committedOnly = options?.committedOnly ?? false;
  const forCompare = options?.forCompare ?? false;
  const mergeDemoOnEmpty = options?.mergeDemoOnEmpty ?? false;

  return useQuery({
    queryKey: [...operatorQueryKeys.askProjectRuns(projectId), committedOnly, forCompare, mergeDemoOnEmpty] as const,
    queryFn: () =>
      loadProjectRunsMergedWithDemoFallback(projectId, {
        committedOnly,
        forCompare,
        mergeDemoOnEmpty,
      }),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
