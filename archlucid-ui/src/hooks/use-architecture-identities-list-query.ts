"use client";

import { useQuery } from "@tanstack/react-query";

import { listArchitectureIdentities } from "@/lib/api/architecture-identity-api";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureIdentityListBlockedReason } from "@/lib/architecture/architecture-identity-blocked-reason";
import { ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE } from "@/lib/inventory-showing-count";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureIdentitiesListQuery(
  page = 1,
  pageSize = ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE,
  options?: { readonly enabled?: boolean; readonly includeArchived?: boolean },
) {
  const scopeKey = useOperatorScopeQueryKey();
  const includeArchived = options?.includeArchived ?? false;

  const query = useQuery({
    queryKey: operatorQueryKeys.architectureIdentityList(scopeKey, page, pageSize, includeArchived),
    queryFn: () => listArchitectureIdentities({ page, pageSize, includeArchived }),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureIdentityListBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
