"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import {
  getGovernanceReviewsAwaitingAction,
  type GovernanceReviewAwaitingActionItem,
} from "@/lib/api/governance-stickiness-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { reviewsAwaitingActionBlockedReason } from "@/lib/governance/governance-stickiness-register-blocked-reason";
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

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = reviewsAwaitingActionBlockedReason(failure);

  return {
    items: query.data?.items ?? EMPTY_ITEMS,
    loadError:
      blockedReason ??
      (query.isError
        ? query.error instanceof Error
          ? query.error.message
          : "Failed to load reviews awaiting action."
        : null),
    blockedReason,
    isLoading: query.isPending,
  };
}
