"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  listActivations,
  listApprovalRequests,
  listPromotions,
} from "@/lib/api/policy-governance-api";
import { resolveGovernanceWorkflowRunLists } from "@/lib/governance/governance-workflow-run-lists-resolve";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type UseGovernanceWorkflowRunListsQueryOptions = {
  readonly enabled?: boolean;
};

export function useGovernanceWorkflowRunListsQuery(
  runId: string | null,
  options?: UseGovernanceWorkflowRunListsQueryOptions,
) {
  const trimmed = runId?.trim() ?? "";
  const enabled = (options?.enabled ?? true) && trimmed.length > 0;

  const [approvalsQuery, promotionsQuery, activationsQuery] = useQueries({
    queries: [
      {
        queryKey: operatorQueryKeys.governanceApprovalRequests(trimmed),
        queryFn: () => listApprovalRequests(trimmed),
        enabled,
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
        retry: false,
      },
      {
        queryKey: operatorQueryKeys.governancePromotions(trimmed),
        queryFn: () => listPromotions(trimmed),
        enabled,
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
        retry: false,
      },
      {
        queryKey: operatorQueryKeys.governanceActivations(trimmed),
        queryFn: () => listActivations(trimmed),
        enabled,
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
        retry: false,
      },
    ],
  });

  const resolved = useMemo(
    () =>
      resolveGovernanceWorkflowRunLists(
        trimmed,
        approvalsQuery.data,
        promotionsQuery.data,
        activationsQuery.data,
        approvalsQuery.error,
        promotionsQuery.error,
        activationsQuery.error,
      ),
    [
      trimmed,
      approvalsQuery.data,
      promotionsQuery.data,
      activationsQuery.data,
      approvalsQuery.error,
      promotionsQuery.error,
      activationsQuery.error,
    ],
  );

  const isPending = enabled && (approvalsQuery.isPending || promotionsQuery.isPending || activationsQuery.isPending);
  const isFetching =
    enabled && (approvalsQuery.isFetching || promotionsQuery.isFetching || activationsQuery.isFetching);
  const isFetched =
    !enabled ||
    (approvalsQuery.isFetched && promotionsQuery.isFetched && activationsQuery.isFetched);

  const refetch = async (): Promise<void> => {
    if (!enabled) {
      return;
    }

    await Promise.all([
      approvalsQuery.refetch(),
      promotionsQuery.refetch(),
      activationsQuery.refetch(),
    ]);
  };

  return {
    approvals: resolved.approvals,
    promotions: resolved.promotions,
    activations: resolved.activations,
    showingStaticDemoGovernanceRecords: resolved.showingStaticDemoGovernanceRecords,
    listFailure: resolved.listFailure,
    isPending,
    isFetching,
    isFetched,
    refetch,
  };
}
