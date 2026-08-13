"use client";

import { useQuery } from "@tanstack/react-query";

import { getArchitectureRiskRegister } from "@/lib/api/governance-stickiness-api";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useAssignedToMeFindingsCountQuery(options?: { readonly enabled?: boolean }) {
  const scope = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operatorQueryKeys.governanceAssignedToMeFindingsCount(scope),
    queryFn: async () => {
      const response = await getArchitectureRiskRegister({ assignedToMe: true, maxRows: 500 });
      return response.entries?.length ?? 0;
    },
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
