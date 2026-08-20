"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { useAlertsInboxEmptyFilteredProps } from "@/components/alerts/use-alerts-inbox-empty-filtered-props";
import {
  useAlertsInboxPageQuery,
  useAlertsInboxSummaryQuery,
  useAlertsInboxWorkspaceContextQuery,
} from "@/components/alerts/use-alerts-inbox-queries";
import { useAlertCardShortcuts } from "@/hooks/useAlertCardShortcuts";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import {
  acknowledgeAlertsBatch,
  applyAlertAction,
  archiveAlert,
  fetchAlertActionLoop,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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
import type { AlertActionLoopDto } from "@/types/operate-rhythm";
import { useSyncAlertsHubHeaderConfigureLink } from "@/components/alerts/AlertsHubHeaderConfigureLinkContext";

type PendingActionState = {
  alertId: string;
  action: AlertActionKind;
};

/** Cursor stack: index 0 is always `""` (first page). Later entries are prior `nextCursor` values. */
function initialCursorStack(initialModel: AlertsInboxPageModel | null): string[] {
  const cursor = initialModel?.cursor ?? "";

  if (cursor.length === 0) {
    return [""];
  }

  // Deep-linked mid-page: treat as a one-entry stack (Previous returns to first page).
  return ["", cursor];
}

export function useAlertsInboxController(initialModel: AlertsInboxPageModel | null) {
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const canMutateAlertInbox = useNavSurface("alerts").mutationCapability;
  const buyerPolishedShell = initialModel?.buyerPolishedShell ?? isBuyerPolishedOperatorShellEnv();
  const [status, setStatus] = useState<string>(initialModel?.status ?? "Open");
  const [cursorStack, setCursorStack] = useState<string[]>(() => initialCursorStack(initialModel));
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(initialModel?.loadFailure ?? null);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionLoopAlertId, setActionLoopAlertId] = useState<string | null>(null);
  const [actionLoopFindingHref, setActionLoopFindingHref] = useState<string | null>(null);
  const [actionLoopData, setActionLoopData] = useState<AlertActionLoopDto | null>(null);
  const [actionLoopLoading, setActionLoopLoading] = useState(false);
  const [actionLoopError, setActionLoopError] = useState<string | null>(null);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [batchAckBusy, setBatchAckBusy] = useState(false);
  const [archiveBusyAlertId, setArchiveBusyAlertId] = useState<string | null>(null);
  const [lastRefreshedUtc, setLastRefreshedUtc] = useState<string | null>(null);

  const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
  const cursor = cursorStack[cursorStack.length - 1] ?? "";
  const page = cursorStack.length;
  const pageQuery = useAlertsInboxPageQuery({ status, cursor, initialModel });
  const summaryQuery = useAlertsInboxSummaryQuery({ initialModel });
  const workspaceQuery = useAlertsInboxWorkspaceContextQuery();

  const alerts = pageQuery.items;
  const hasMore = pageQuery.hasMore;
  const nextCursor = pageQuery.nextCursor;
  const loading = pageQuery.loading;
  const summaryCounts = summaryQuery.summary;
  const summaryLoading = summaryQuery.loading;
  const workspaceContext = workspaceQuery.workspaceContext;

  const canGoPrevious = cursorStack.length > 1;
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

  useEffect(() => {
    setSelectedAlertIds((prev) => {
      const next = prev.filter((id) => alerts.some((row) => row.alertId === id));

      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }

      return next;
    });
  }, [alerts]);

  const refreshInbox = useCallback(
    async (options?: { readonly refreshSummary?: boolean }) => {
      const statusFilterValue = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;

      await queryClient.invalidateQueries({
        queryKey: operatorQueryKeys.alertsInboxPage(scope, { statusFilter: statusFilterValue, cursor }),
      });

      if (options?.refreshSummary === true) {
        await queryClient.invalidateQueries({
          queryKey: operatorQueryKeys.alertsInboxSummary(scope),
        });
      }
    },
    [cursor, queryClient, scope, status],
  );

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => alert.isArchived !== true),
    [alerts],
  );

  const selectedOnPageCount = useMemo(
    () => visibleAlerts.filter((alert) => selectedAlertIds.includes(alert.alertId)).length,
    [visibleAlerts, selectedAlertIds],
  );

  const allVisibleSelected =
    visibleAlerts.length > 0 && selectedOnPageCount === visibleAlerts.length;

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
    status,
  );
  const scopeRecord = useOperatorScopeRecord();
  const alertsInboxEmptyVariant = resolveAlertsInboxEmptyVariant(
    workspaceContext,
    status,
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
    status,
    ALERTS_INBOX_ALL_STATUSES_VALUE,
  );
  useSyncAlertsHubHeaderConfigureLink(showHeaderConfigureLink);

  const act = useCallback(
    async (alertId: string, action: AlertActionKind, comment: string) => {
      setFailure(null);

      try {
        await applyAlertAction(alertId, action, comment);
        await refreshInbox({ refreshSummary: true });
      } catch (e) {
        setFailure(toApiLoadFailure(e));
      }
    },
    [refreshInbox],
  );

  const onAlertShortcutAction = useCallback((alertId: string, action: string) => {

    if (action === "Acknowledge" || action === "Resolve" || action === "Suppress") {
      setPendingAction({ alertId, action });
      setActionComment("");
    }
  }, []);

  useAlertCardShortcuts({ onAction: onAlertShortcutAction, mutationsEnabled: canMutateAlertInbox });

  async function onAcknowledgeSelected(): Promise<void> {
    if (!canMutateAlertInbox || selectedAlertIds.length === 0) {
      return;
    }

    setBatchAckBusy(true);
    setFailure(null);

    try {
      await acknowledgeAlertsBatch(selectedAlertIds);
      setSelectedAlertIds([]);
      await refreshInbox({ refreshSummary: true });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setBatchAckBusy(false);
    }
  }

  async function onArchiveAlert(alertId: string): Promise<void> {
    if (!canMutateAlertInbox) {
      return;
    }

    setArchiveBusyAlertId(alertId);
    setFailure(null);

    try {
      await archiveAlert(alertId);
      setSelectedAlertIds((prev) => prev.filter((id) => id !== alertId));
      await refreshInbox({ refreshSummary: true });
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setArchiveBusyAlertId(null);
    }
  }

  function toggleAlertSelected(alertId: string, checked: boolean): void {
    setSelectedAlertIds((prev) => {
      if (checked) {
        if (prev.includes(alertId)) {
          return prev;
        }

        return [...prev, alertId];
      }

      return prev.filter((id) => id !== alertId);
    });
  }

  function toggleSelectAllVisible(checked: boolean): void {
    if (!checked) {
      setSelectedAlertIds([]);

      return;
    }

    setSelectedAlertIds(visibleAlerts.map((alert) => alert.alertId));
  }

  async function onConfirmActionDialog(): Promise<void> {
    if (pendingAction === null || !canMutateAlertInbox) {
      return;
    }

    setActionBusy(true);

    try {
      await act(pendingAction.alertId, pendingAction.action, actionComment.trim());
      setPendingAction(null);
      setActionComment("");
    } finally {
      setActionBusy(false);
    }
  }

  function openRoutingDelivery(alertId: string, findingDetailHref: string | null): void {
    setActionLoopAlertId(alertId);
    setActionLoopFindingHref(findingDetailHref);
    setActionLoopData(null);
    setActionLoopError(null);
    setActionLoopLoading(true);
    void fetchAlertActionLoop(alertId)
      .then((row) => {
        setActionLoopData(row);
      })
      .catch((e: unknown) => {
        setActionLoopError(e instanceof Error ? e.message : "Could not load action loop.");
      })
      .finally(() => {
        setActionLoopLoading(false);
      });
  }

  function changeStatusFilter(value: string): void {
    setStatus(value);
    setCursorStack([""]);
  }

  function goNextPage(): void {
    if (!canGoNext || nextCursor === null || nextCursor === undefined) {
      return;
    }

    setCursorStack((prev) => [...prev, nextCursor]);
  }

  function goPreviousPage(): void {
    if (!canGoPrevious) {
      return;
    }

    setCursorStack((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.slice(0, -1);
    });
  }

  function clearPendingAction(): void {
    setPendingAction(null);
    setActionComment("");
  }

  function queuePendingAction(alertId: string, action: AlertActionKind): void {
    setPendingAction({ alertId, action });
    setActionComment("");
  }

  function closeActionLoopDialog(): void {
    setActionLoopAlertId(null);
    setActionLoopFindingHref(null);
    setActionLoopData(null);
    setActionLoopError(null);
  }

  return {
    actionBusy,
    actionComment,
    actionLoopAlertId,
    actionLoopData,
    actionLoopError,
    actionLoopFindingHref,
    actionLoopLoading,
    alerts,
    allVisibleSelected,
    archiveBusyAlertId,
    batchAckBusy,
    buyerPolishedShell,
    canGoNext,
    canGoPrevious,
    canMutateAlertInbox,
    changeStatusFilter,
    clearPendingAction,
    closeActionLoopDialog,
    emptyFilteredProps,
    workspaceScopeEmptyTeaching,
    failure,
    goNextPage,
    goPreviousPage,
    hasMore,
    lastRefreshedUtc,
    loading,
    onAcknowledgeSelected,
    onArchiveAlert,
    onConfirmActionDialog,
    openRoutingDelivery,
    page,
    pageMixSummary,
    pendingAction,
    queuePendingAction,
    selectedAlertIds,
    setActionComment,
    status,
    summaryCounts,
    summaryLoading,
    toggleAlertSelected,
    toggleSelectAllVisible,
    visibleAlerts,
    workspaceContext,
    load: refreshInbox,
  };
}

export type AlertsInboxController = ReturnType<typeof useAlertsInboxController>;
