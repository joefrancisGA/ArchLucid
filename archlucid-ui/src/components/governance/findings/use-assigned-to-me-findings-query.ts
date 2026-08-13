"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  fetchAssignedToMeFindingQueueRows,
  type GovernanceFindingsFetchFailure,
} from "@/components/governance/findings/governance-findings-query-fetch";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
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
};

export function useAssignedToMeFindingsQuery(enabled = true): AssignedToMeFindingsQueryState {
  const scope = useOperatorScopeQueryKey();

  const query = useQuery({
    queryKey: operatorQueryKeys.governanceAssignedToMeFindingsQueue(scope),
    queryFn: () => fetchAssignedToMeFindingQueueRows(),
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
  };
}
