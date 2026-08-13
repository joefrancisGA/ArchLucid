"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { fetchAssignedToMeFindingQueueRows } from "@/components/governance/findings/governance-findings-query-fetch";
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
  readonly refresh: () => void;
};

export function useAssignedToMeFindingsQuery(): AssignedToMeFindingsQueryState {
  const scope = useOperatorScopeQueryKey();

  const query = useQuery({
    queryKey: operatorQueryKeys.governanceAssignedToMeFindingsQueue(scope),
    queryFn: () => fetchAssignedToMeFindingQueueRows(),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    rows: query.data?.rows ?? [],
    loading: query.isPending || query.isFetching,
    loadFailed: query.data?.loadFailed ?? false,
    refresh,
  };
}
