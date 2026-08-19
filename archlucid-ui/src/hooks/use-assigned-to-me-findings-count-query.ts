"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { fetchAndHydrateOperatorShellStatus } from "@/lib/operator/operator-shell-status-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_GC_MS } from "@/lib/query/operator-query-stale-time";

/**
 * Assigned-to-me count is a projection of `GET /v1/operator/shell-status`.
 * Never download the risk register for a badge count — that path loads up to 500 rows.
 * `staleTime: Infinity` keeps observers on hydrate/`setQueryData` from shell-status.
 */
export function useAssignedToMeFindingsCountQuery(options?: { readonly enabled?: boolean }) {
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const enabled = (options?.enabled ?? true) && concernFetchEnabled;

  return useQuery({
    queryKey: operatorQueryKeys.governanceAssignedToMeFindingsCount(scope),
    queryFn: async () => {
      const payload = await fetchAndHydrateOperatorShellStatus(queryClient, scope);

      return payload.assignedToMeFindingsCount ?? 0;
    },
    enabled,
    staleTime: Infinity,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
