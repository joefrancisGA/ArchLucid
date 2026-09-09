"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { getGovernanceAssignedToMeFindingsCount } from "@/lib/api/governance-stickiness-api-registers";
import { governanceAssignedToMeCountBlockedReason } from "@/lib/governance/governance-assigned-to-me-count-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS, OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

/**
 * Assigned-to-me count via sealed-manifest-aware `GET /v1/governance/.../assigned-to-me-count`.
 */
export function useAssignedToMeFindingsCountQuery(options?: { readonly enabled?: boolean }) {
  const scope = useOperatorScopeQueryKey();
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const enabled = (options?.enabled ?? true) && concernFetchEnabled;
  const projectId = scope.projectId?.trim() ?? undefined;

  const query = useQuery({
    queryKey: operatorQueryKeys.governanceAssignedToMeFindingsCount(scope),
    queryFn: async () => {
      const payload = await getGovernanceAssignedToMeFindingsCount(projectId);

      return payload.count ?? 0;
    },
    enabled,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = governanceAssignedToMeCountBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
