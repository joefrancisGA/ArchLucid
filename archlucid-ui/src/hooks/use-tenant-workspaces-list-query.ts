"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { fetchTenantWorkspacesList } from "@/lib/tenant-workspaces-list-client";

export function useTenantWorkspacesListQuery() {
  const scope = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operatorQueryKeys.tenantWorkspacesList(scope),
    queryFn: fetchTenantWorkspacesList,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
