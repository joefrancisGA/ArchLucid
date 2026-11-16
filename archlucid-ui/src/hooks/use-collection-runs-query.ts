"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { fetchCollectionRuns, triggerCollectionRun } from "@/lib/collection-runs-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  getOperatorScopeQueryKeySnapshot,
  parseOperatorScopeQueryKey,
} from "@/lib/operator/operator-scope-query-key";

export const collectionRunsQueryKeys = {
  list: (scopeKey: ReturnType<typeof useOperatorScopeQueryKey>) =>
    ["collection-runs", "list", scopeKey] as const,
};

export function useCollectionRunsQuery() {
  const scopeKey = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: collectionRunsQueryKeys.list(scopeKey),
    queryFn: () => fetchCollectionRuns(),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
    refetchInterval: (currentQuery) =>
      currentQuery.state.data?.some((run) => run.status === "Running") === true ? 5000 : false,
  });
}

export function useTriggerCollectionRunMutation() {
  const queryClient = useQueryClient();
  const pendingKeys = useRef(new Map<string, string>());

  return useMutation({
    mutationFn: async (idempotencyKey: string) => {
      const scopeId = getOperatorScopeQueryKeySnapshot();
      const key = pendingKeys.current.get(scopeId) ?? idempotencyKey;
      pendingKeys.current.set(scopeId, key);

      const run = await triggerCollectionRun(key);
      if (pendingKeys.current.get(scopeId) === key) {
        pendingKeys.current.delete(scopeId);
      }
      await queryClient.invalidateQueries({
        queryKey: collectionRunsQueryKeys.list(parseOperatorScopeQueryKey(scopeId)),
        refetchType: scopeId === getOperatorScopeQueryKeySnapshot() ? "active" : "none",
      });
      return run;
    },
  });
}
