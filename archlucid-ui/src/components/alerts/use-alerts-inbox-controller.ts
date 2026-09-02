"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAlertsInboxBatchActions } from "@/components/alerts/use-alerts-inbox-batch-actions";
import { useAlertsInboxPagination } from "@/components/alerts/use-alerts-inbox-pagination";
import { useAlertsInboxEmptyFilteredProps } from "@/components/alerts/use-alerts-inbox-empty-filtered-props";
import {
  useAlertsInboxPageQuery,
  useAlertsInboxSummaryQuery,
  useAlertsInboxWorkspaceContextQuery,
} from "@/components/alerts/use-alerts-inbox-queries";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  resolveAlertsInboxEmptyVariant,
  shouldShowAlertsHeaderConfigureRulesLink,
} from "@/lib/alerts-inbox-workspace-context";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { useNavSurface } from "@/lib/use-nav-surface";
import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";
import {
  ALERTS_INBOX_ALL_STATUSES_VALUE,
} from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";
import { useSyncAlertsHubHeaderConfigureLink } from "@/components/alerts/AlertsHubHeaderConfigureLinkContext";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";

function matchesAlertsInboxRunScope(alert: { runId?: string | null }, scopedRunId: string): boolean {
  if (scopedRunId.trim().length === 0) {
    return true;
  }

  const runId = (alert.runId ?? "").trim();

  return runId.length > 0 && runId === scopedRunId.trim();
}

export function useAlertsInboxController(initialModel: AlertsInboxPageModel | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const canMutateAlertInbox = useNavSurface("alerts").mutationCapability;
  const buyerPolishedShell = initialModel?.buyerPolishedShell ?? isBuyerPolishedOperatorShellEnv();
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(initialModel?.loadFailure ?? null);
  const [lastRefreshedUtc, setLastRefreshedUtc] = useState<string | null>(null);

  const pagination = useAlertsInboxPagination(initialModel);
  const pageQuery = useAlertsInboxPageQuery({
    status: pagination.status,
    cursor: pagination.cursor,
    initialModel,
  });
  const summaryQuery = useAlertsInboxSummaryQuery({ initialModel });
  const workspaceQuery = useAlertsInboxWorkspaceContextQuery();

  const alerts = pageQuery.items;
  const hasMore = pageQuery.hasMore;
  const nextCursor = pageQuery.nextCursor;
  const loading = pageQuery.loading;
  const summaryCounts = summaryQuery.summary;
  const summaryLoading = summaryQuery.loading;
  const workspaceContext = workspaceQuery.workspaceContext;

  const canGoNext =
    hasMore && nextCursor !== null && nextCursor !== undefined && nextCursor.length > 0;

  useEffect(() => {
    if (pageQuery.loadFailure !== null) {
      setFailure(pageQuery.loadFailure);
    } else if (!pageQuery.loading) {
      setFailure(null);
    }
  }, [pageQuery.loadFailure, pageQuery.loading]);

  useEffect(() => {
    if (!pageQuery.loading && pageQuery.loadFailure === null) {
      setLastRefreshedUtc(new Date().toISOString());
    }
  }, [pageQuery.loading, pageQuery.loadFailure, pageQuery.items, pageQuery.hasMore]);

  const statusFilter = pagination.status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : pagination.status;

  const refreshInbox = useCallback(
    async (options?: { readonly refreshSummary?: boolean }) => {
      await queryClient.invalidateQueries({
        queryKey: operatorQueryKeys.alertsInboxPage(scope, { statusFilter, cursor: pagination.cursor }),
      });

      if (options?.refreshSummary === true) {
        await queryClient.invalidateQueries({
          queryKey: operatorQueryKeys.alertsInboxSummary(scope),
        });
      }
    },
    [pagination.cursor, queryClient, scope, statusFilter],
  );

  const visibleAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => alert.isArchived !== true && matchesAlertsInboxRunScope(alert, scopedRunId),
      ),
    [alerts, scopedRunId],
  );

  const batchActions = useAlertsInboxBatchActions({
    visibleAlerts,
    canMutateAlertInbox,
    refreshInbox,
    setFailure,
  });

  const onPickReviewForTriage = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${GOVERNANCE_ALERTS_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const pageMixSummary = useMemo(() => {
    if (visibleAlerts.length === 0) {
      return null;
    }

    const parts: string[] = [];

    for (const label of ["Open", "Acknowledged", "Resolved", "Suppressed"]) {
      const n = visibleAlerts.filter((a) => a.status === label).length;

      if (n > 0) {
        parts.push(`${n} ${label}`);
      }
    }

    return parts.length > 0 ? parts.join(" · ") : null;
  }, [visibleAlerts]);

  const emptyFilteredProps = useAlertsInboxEmptyFilteredProps(
    buyerPolishedShell,
    canMutateAlertInbox,
    workspaceContext,
    pagination.status,
  );
  const scopeRecord = useOperatorScopeRecord();
  const alertsInboxEmptyVariant = resolveAlertsInboxEmptyVariant(
    workspaceContext,
    pagination.status,
    ALERTS_INBOX_ALL_STATUSES_VALUE,
  );
  const workspaceScopeEmptyTeaching =
    alertsInboxEmptyVariant === "healthy_clear"
      ? resolveWorkspaceScopeEmptyTeachingForHub({
          listEmpty: !loading && failure === null && visibleAlerts.length === 0,
          scopeRecord,
          objectPlural: "alerts",
        })
      : null;

  const showHeaderConfigureLink = shouldShowAlertsHeaderConfigureRulesLink(
    workspaceContext,
    pagination.status,
    ALERTS_INBOX_ALL_STATUSES_VALUE,
  );
  useSyncAlertsHubHeaderConfigureLink(showHeaderConfigureLink);

  function goNextPage(): void {
    if (!canGoNext || nextCursor === null || nextCursor === undefined) {
      return;
    }

    pagination.goNextPage(nextCursor);
  }

  return {
    ...batchActions,
    alerts,
    buyerPolishedShell,
    canGoNext,
    canGoPrevious: pagination.canGoPrevious,
    canMutateAlertInbox,
    changeStatusFilter: pagination.changeStatusFilter,
    emptyFilteredProps,
    workspaceScopeEmptyTeaching,
    failure,
    goNextPage,
    goPreviousPage: pagination.goPreviousPage,
    hasMore,
    lastRefreshedUtc,
    loading,
    page: pagination.page,
    pageMixSummary,
    status: pagination.status,
    summaryCounts,
    summaryLoading,
    visibleAlerts,
    scopedRunId,
    scopedRunFilterActive,
    onPickReviewForTriage,
    workspaceContext,
    load: refreshInbox,
  };
}

export type AlertsInboxController = ReturnType<typeof useAlertsInboxController>;
