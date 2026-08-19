"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import {
  getGovernanceReviewsAwaitingAction,
  type GovernanceReviewAwaitingActionItem,
} from "@/lib/api/governance-stickiness-api";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

const EMPTY_ITEMS: GovernanceReviewAwaitingActionItem[] = [];

export function useGovernanceReviewsAwaitingActionQuery() {
  const scope = useOperatorScopeQueryKey();
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();

  const query = useQuery({
    queryKey: operatorQueryKeys.governanceReviewsAwaitingAction(scope),
    queryFn: getGovernanceReviewsAwaitingAction,
    enabled: concernFetchEnabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  return {
    items: query.data?.items ?? EMPTY_ITEMS,
    loadError:
      query.isError
        ? query.error instanceof Error
          ? query.error.message
          : "Failed to load reviews awaiting action."
        : null,
    isLoading: query.isPending,
  };
}
