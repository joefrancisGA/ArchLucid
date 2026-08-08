"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  fetchAlertsInboxPage,
  fetchAlertsInboxSummary,
  fetchAlertsInboxWorkspaceContext,
} from "@/components/alerts/alerts-inbox-query-fetch";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import type { AlertsInboxWorkspaceContext } from "@/lib/alerts-inbox-workspace-context";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";
import { ALERTS_INBOX_ALL_STATUSES_VALUE } from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";

const EMPTY_SUMMARY: AlertsInboxSummaryCounts = {
  open: 0,
  acknowledged: 0,
  resolved: 0,
  blocking: 0,
  lastEvaluatedUtc: null,
};

const EMPTY_WORKSPACE_CONTEXT: AlertsInboxWorkspaceContext = {
  hasReviews: false,
  hasAlertRules: false,
  loading: true,
};

export function useAlertsInboxPageQuery(args: {
  readonly status: string;
  readonly page: number;
  readonly initialModel: AlertsInboxPageModel | null;
}) {
  const scope = useOperatorScopeQueryKey();
  const statusFilter = args.status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : args.status;
  const matchesInitialSnapshot =
    args.initialModel !== null &&
    args.status === args.initialModel.status &&
    args.page === args.initialModel.page;

  const query = useQuery({
    queryKey: operatorQueryKeys.alertsInboxPage(scope, { statusFilter, page: args.page }),
    queryFn: () => fetchAlertsInboxPage(statusFilter, args.page),
    initialData:
      matchesInitialSnapshot && args.initialModel !== null
        ? {
            items: args.initialModel.items,
            totalCount: args.initialModel.totalCount,
            loadFailure: args.initialModel.loadFailure,
          }
        : undefined,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    items: query.data?.items ?? [],
    totalCount: query.data?.totalCount ?? 0,
    loadFailure: query.data?.loadFailure ?? null,
    loading: query.isPending || query.isFetching,
    refresh,
  };
}

export function useAlertsInboxSummaryQuery(args: {
  readonly initialModel: AlertsInboxPageModel | null;
}) {
  const scope = useOperatorScopeQueryKey();

  const query = useQuery({
    queryKey: operatorQueryKeys.alertsInboxSummary(scope),
    queryFn: fetchAlertsInboxSummary,
    placeholderData:
      args.initialModel !== null
        ? {
            open: args.initialModel.status === "Open" ? args.initialModel.totalCount : 0,
            acknowledged: 0,
            resolved: 0,
            blocking: 0,
            lastEvaluatedUtc: null,
          }
        : undefined,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    summary: query.data ?? EMPTY_SUMMARY,
    loading: query.isPlaceholderData || query.isPending,
    refresh,
  };
}

export function useAlertsInboxWorkspaceContextQuery() {
  const scope = useOperatorScopeQueryKey();

  const query = useQuery({
    queryKey: operatorQueryKeys.alertsInboxWorkspaceContext(scope),
    queryFn: fetchAlertsInboxWorkspaceContext,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });

  return {
    workspaceContext: query.data ?? EMPTY_WORKSPACE_CONTEXT,
    loading: query.isPending,
  };
}
