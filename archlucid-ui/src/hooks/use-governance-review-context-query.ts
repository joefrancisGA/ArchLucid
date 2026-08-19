"use client";

import { useQuery } from "@tanstack/react-query";

import { loadGovernanceReviewContext } from "@/app/(operator)/governance/_sections/load-governance-review-context";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type UseGovernanceReviewContextQueryOptions = {
  readonly enabled?: boolean;
};

export function useGovernanceReviewContextQuery(
  runId: string | null,
  options?: UseGovernanceReviewContextQueryOptions,
) {
  const trimmed = runId?.trim() ?? "";

  return useQuery({
    queryKey: operatorQueryKeys.governanceReviewContext(trimmed),
    queryFn: () => loadGovernanceReviewContext(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
