"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { useAlertsInboxEmptyFilteredProps } from "@/components/alerts/use-alerts-inbox-empty-filtered-props";
import { useAlertCardShortcuts } from "@/hooks/useAlertCardShortcuts";
import {
  acknowledgeAlertsBatch,
  applyAlertAction,
  archiveAlert,
  fetchAlertActionLoop,
  listAlertsPaged,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { shouldMergeOperatorDemoAlertSample, tryStaticDemoAlertInboxRow } from "@/lib/operator-static-demo";
import { useNavSurface } from "@/lib/use-nav-surface";
import type { AlertsInboxPageModel } from "@/app/(operator)/alerts/_sections/alerts-inbox-page-model";
import {
  ALERTS_INBOX_ALL_STATUSES_VALUE,
  ALERTS_INBOX_PAGE_SIZE,
} from "@/app/(operator)/alerts/_sections/load-alerts-inbox-page-model";
import type { AlertActionLoopDto } from "@/types/operate-rhythm";
import type { AlertRecord } from "@/types/alerts";

type PendingActionState = {
  alertId: string;
  action: AlertActionKind;
};

export function useAlertsInboxController(initialModel: AlertsInboxPageModel | null) {
  const canMutateAlertInbox = useNavSurface("alerts").mutationCapability;
  const buyerPolishedShell = initialModel?.buyerPolishedShell ?? isBuyerPolishedOperatorShellEnv();
  const [alerts, setAlerts] = useState<AlertRecord[]>(initialModel?.items ?? []);
  const [status, setStatus] = useState<string>(initialModel?.status ?? "Open");
  const [page, setPage] = useState(initialModel?.page ?? 1);
  const [totalCount, setTotalCount] = useState(initialModel?.totalCount ?? 0);
  const [loading, setLoading] = useState(false);
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

  const totalPages = Math.max(1, Math.ceil(totalCount / ALERTS_INBOX_PAGE_SIZE));

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

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
      const data = await listAlertsPaged(statusFilter, page, ALERTS_INBOX_PAGE_SIZE);
      let items = data.items;
      let total = data.totalCount;

      if (shouldMergeOperatorDemoAlertSample() && items.length === 0) {
        const demoRow = tryStaticDemoAlertInboxRow();

        if (statusFilter === null || statusFilter === "Open") {
          items = [demoRow];
          total = 1;
        }
      }

      setAlerts(items);
      setTotalCount(total);
      setSelectedAlertIds((prev) => prev.filter((id) => items.some((row) => row.alertId === id)));
      const pages = Math.max(1, Math.ceil(data.totalCount / ALERTS_INBOX_PAGE_SIZE));

      if (data.totalCount > 0 && page > pages) {
        setPage(pages);
      }
    } catch (e) {
      if (shouldMergeOperatorDemoAlertSample()) {
        const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
        const demoRow = tryStaticDemoAlertInboxRow();

        if (statusFilter === null || statusFilter === "Open") {
          setAlerts([demoRow]);
          setTotalCount(1);
        } else {
          setAlerts([]);
          setTotalCount(0);
        }
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  const matchesInitialSnapshot =
    initialModel !== null &&
    status === initialModel.status &&
    page === initialModel.page;

  useEffect(() => {
    if (matchesInitialSnapshot && initialModel !== null) {
      return;
    }

    void load();
  }, [initialModel, load, matchesInitialSnapshot]);

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

  const emptyFilteredProps = useAlertsInboxEmptyFilteredProps(buyerPolishedShell, canMutateAlertInbox);

  const act = useCallback(
    async (alertId: string, action: AlertActionKind, comment: string) => {
      setFailure(null);

      try {
        await applyAlertAction(alertId, action, comment);
        await load();
      } catch (e) {
        setFailure(toApiLoadFailure(e));
      }
    },
    [load],
  );

  const onAlertShortcutAction = useCallback((alertId: string, action: string) => {

    if (action === "Acknowledge" || action === "Resolve" || action === "Suppress") {
      setPendingAction({ alertId, action });
      setActionComment("");
    }
  }, []);

  /** Alt+1–3 register only when `canMutateAlertInbox`; buttons may still open read-only triage preview at read rank. */
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
      await load();
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
      await load();
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
    setPage(1);
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
    canMutateAlertInbox,
    changeStatusFilter,
    clearPendingAction,
    closeActionLoopDialog,
    emptyFilteredProps,
    failure,
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
    setPage,
    status,
    toggleAlertSelected,
    toggleSelectAllVisible,
    totalCount,
    totalPages,
    visibleAlerts,
    load,
  };
}

export type AlertsInboxController = ReturnType<typeof useAlertsInboxController>;
