"use client";

import { useQuery } from "@tanstack/react-query";

import { listArchitectureIdentities } from "@/lib/api/architecture-identity-api";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE } from "@/lib/inventory-showing-count";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureIdentitiesListQuery(
  page = 1,
  pageSize = ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE,
) {
  const scopeKey = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operatorQueryKeys.architectureIdentityList(scopeKey, page, pageSize),
    queryFn: () => listArchitectureIdentities({ page, pageSize }),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
