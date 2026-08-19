"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  fetchAssignedToMeFindingQueueRows,
  type GovernanceFindingsFetchFailure,
} from "@/components/governance/findings/governance-findings-query-fetch";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { GovernanceAssignedToMeFetchBasis } from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import { resolveGovernanceAssignedToMeIdentities } from "@/lib/governance/governance-assigned-to-me-identities";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export type AssignedToMeFindingsQueryState = {
  readonly rows: GovernanceFindingQueueRow[];
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly loadFailure: GovernanceFindingsFetchFailure | null;
  readonly refresh: () => void;
  readonly dataUpdatedAt: number;
  readonly refreshing: boolean;
  readonly fetchBasis: GovernanceAssignedToMeFetchBasis | null;
};

export function useAssignedToMeFindingsQuery(enabled = true): AssignedToMeFindingsQueryState {
  const scope = useOperatorScopeQueryKey();
  const { currentPrincipal } = useOperatorNavAuthority();
  const assigneeIdentities = useMemo(
    () => resolveGovernanceAssignedToMeIdentities(currentPrincipal),
    [currentPrincipal],
  );

  const query = useQuery({
    queryKey: operatorQueryKeys.governanceAssignedToMeFindingsQueue(scope),
    queryFn: () => fetchAssignedToMeFindingQueueRows({ assigneeIdentities }),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    enabled,
  });

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    rows: query.data?.rows ?? [],
    loading: query.isPending,
    loadFailed: query.data?.loadFailed ?? false,
    loadFailure: query.data?.failure ?? null,
    refresh,
    dataUpdatedAt: query.dataUpdatedAt,
    refreshing: query.isFetching && !query.isPending,
    fetchBasis: query.data?.assignedToMeBasis ?? null,
  };
}
