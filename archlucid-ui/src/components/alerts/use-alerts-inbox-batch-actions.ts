"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { useAlertCardShortcuts, focusAdjacentAlertCard, getFocusedAlertId } from "@/hooks/useAlertCardShortcuts";
import {
  alertsInboxBatchSelectionHrefFromSearch,
  parseAlertsInboxActionAlertIdFromSearch,
  parseAlertsInboxActionKindFromSearch,
  parseAlertsInboxActionLoopIdFromSearch,
  parseAlertsInboxBulkSelectionFromSearch,
} from "@/lib/alerts/alerts-inbox-batch-selection-url";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import {
  COMMAND_PALETTE_ALERT_ACKNOWLEDGE_EVENT,
  COMMAND_PALETTE_ALERT_NEXT_EVENT,
  COMMAND_PALETTE_ALERT_PREV_EVENT,
  COMMAND_PALETTE_ALERT_RESOLVE_EVENT,
  COMMAND_PALETTE_ALERT_SUPPRESS_EVENT,
} from "@/lib/command-palette-handler-actions";
import {
  acknowledgeAlertsBatch,
  applyAlertAction,
  archiveAlert,
  fetchAlertActionLoop,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AlertActionLoopDto } from "@/types/operate-rhythm";
import type { AlertRecord } from "@/types/alerts";

type PendingActionState = {
  alertId: string;
  action: AlertActionKind;
};

export function useAlertsInboxBatchActions(options: {
  readonly visibleAlerts: readonly AlertRecord[];
  readonly canMutateAlertInbox: boolean;
  readonly refreshInbox: (options?: { readonly refreshSummary?: boolean }) => Promise<void>;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
}) {
  const { visibleAlerts, canMutateAlertInbox, refreshInbox, setFailure } = options;
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ALERTS_PATH;
  const searchParams = useSearchParams();
  const urlBulkAlertsRaw = searchParams.get("bulkAlerts");
  const urlActionLoopId = parseAlertsInboxActionLoopIdFromSearch(searchParams.get("alertLoopId"));
  const urlActionAlertId = parseAlertsInboxActionAlertIdFromSearch(searchParams.get("alertActionId"));
  const urlActionKind = parseAlertsInboxActionKindFromSearch(searchParams.get("alertAction"));

  const syncAlertsInboxBatchToUrl = useCallback(
    (state: {
      readonly bulkAlertIds: readonly string[];
      readonly actionLoopAlertId: string | null;
      readonly pendingActionAlertId: string | null;
      readonly pendingActionKind: AlertActionKind | null;
    }) => {
      router.replace(
        alertsInboxBatchSelectionHrefFromSearch(
          searchParams.toString(),
          {
            bulkAlertIds: state.bulkAlertIds,
            actionLoopAlertId: state.actionLoopAlertId,
            pendingActionAlertId: state.pendingActionAlertId,
            pendingActionKind: state.pendingActionKind,
          },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const [pendingAction, setPendingActionState] = useState<PendingActionState | null>(() => {
    if (urlActionAlertId.length === 0 || urlActionKind === null) {
      return null;
    }

    return { alertId: urlActionAlertId, action: urlActionKind };
  });
  const [actionComment, setActionComment] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionLoopAlertId, setActionLoopAlertIdState] = useState<string | null>(
    urlActionLoopId.length > 0 ? urlActionLoopId : null,
  );
  const [actionLoopFindingHref, setActionLoopFindingHref] = useState<string | null>(null);
  const [actionLoopData, setActionLoopData] = useState<AlertActionLoopDto | null>(null);
  const [actionLoopLoading, setActionLoopLoading] = useState(false);
  const [actionLoopError, setActionLoopError] = useState<string | null>(null);
  const [selectedAlertIds, setSelectedAlertIdsState] = useState<string[]>(() => [
    ...parseAlertsInboxBulkSelectionFromSearch(urlBulkAlertsRaw),
  ]);
  const [batchAckBusy, setBatchAckBusy] = useState(false);
  const [archiveBusyAlertId, setArchiveBusyAlertId] = useState<string | null>(null);

  const setSelectedAlertIds = useCallback(
    (next: string[] | ((prev: string[]) => string[])) => {
      setSelectedAlertIdsState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;

        syncAlertsInboxBatchToUrl({
          bulkAlertIds: resolved,
          actionLoopAlertId,
          pendingActionAlertId: pendingAction?.alertId ?? null,
          pendingActionKind: pendingAction?.action ?? null,
        });

        return resolved;
      });
    },
    [actionLoopAlertId, pendingAction, syncAlertsInboxBatchToUrl],
  );

  const setPendingAction = useCallback(
    (next: PendingActionState | null) => {
      setPendingActionState(next);
      syncAlertsInboxBatchToUrl({
        bulkAlertIds: selectedAlertIds,
        actionLoopAlertId,
        pendingActionAlertId: next?.alertId ?? null,
        pendingActionKind: next?.action ?? null,
      });
    },
    [actionLoopAlertId, selectedAlertIds, syncAlertsInboxBatchToUrl],
  );

  const setActionLoopAlertId = useCallback(
    (next: string | null) => {
      setActionLoopAlertIdState(next);
      syncAlertsInboxBatchToUrl({
        bulkAlertIds: selectedAlertIds,
        actionLoopAlertId: next,
        pendingActionAlertId: pendingAction?.alertId ?? null,
        pendingActionKind: pendingAction?.action ?? null,
      });
    },
    [pendingAction, selectedAlertIds, syncAlertsInboxBatchToUrl],
  );

  useEffect(() => {
    setSelectedAlertIdsState([...parseAlertsInboxBulkSelectionFromSearch(urlBulkAlertsRaw)]);
  }, [urlBulkAlertsRaw]);

  useEffect(() => {
    if (urlActionLoopId.length > 0 && actionLoopAlertId !== urlActionLoopId) {
      setActionLoopAlertIdState(urlActionLoopId);
    }
  }, [actionLoopAlertId, urlActionLoopId]);

  useEffect(() => {
    if (urlActionAlertId.length > 0 && urlActionKind !== null) {
      setPendingActionState({ alertId: urlActionAlertId, action: urlActionKind });
    }
  }, [urlActionAlertId, urlActionKind]);

  useEffect(() => {
    setSelectedAlertIds((prev) => {
      const next = prev.filter((id) => visibleAlerts.some((row) => row.alertId === id));

      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }

      return next;
    });
  }, [setSelectedAlertIds, visibleAlerts]);

  useEffect(() => {
    if (urlActionLoopId.length === 0 || actionLoopData !== null || actionLoopLoading) {
      return;
    }

    setActionLoopLoading(true);
    setActionLoopError(null);
    void fetchAlertActionLoop(urlActionLoopId)
      .then((row) => {
        setActionLoopData(row);
      })
      .catch((e: unknown) => {
        setActionLoopError(e instanceof Error ? e.message : "Could not load action loop.");
      })
      .finally(() => {
        setActionLoopLoading(false);
      });
  }, [actionLoopData, actionLoopLoading, urlActionLoopId]);

  const selectedOnPageCount = useMemo(
    () => visibleAlerts.filter((alert) => selectedAlertIds.includes(alert.alertId)).length,
    [visibleAlerts, selectedAlertIds],
  );

  const allVisibleSelected =
    visibleAlerts.length > 0 && selectedOnPageCount === visibleAlerts.length;

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
    [refreshInbox, setFailure],
  );

  const onAlertShortcutAction = useCallback((alertId: string, action: string) => {
    if (action === "Acknowledge" || action === "Resolve" || action === "Suppress") {
      setPendingAction({ alertId, action });
      setActionComment("");
    }
  }, [setPendingAction]);

  useAlertCardShortcuts({ onAction: onAlertShortcutAction, mutationsEnabled: canMutateAlertInbox });

  useEffect(() => {
    function resolveFocusedAlertId(): string | null {
      const focused = getFocusedAlertId();

      if (focused !== null) {
        return focused;
      }

      focusAdjacentAlertCard(1, { startFromFirstWhenUnfocused: true });

      return getFocusedAlertId();
    }

    function onNext(): void {
      focusAdjacentAlertCard(1, { startFromFirstWhenUnfocused: true });
    }

    function onPrev(): void {
      focusAdjacentAlertCard(-1, { startFromFirstWhenUnfocused: true });
    }

    function onAcknowledge(): void {
      if (!canMutateAlertInbox) {
        return;
      }

      const alertId = resolveFocusedAlertId();

      if (alertId !== null) {
        onAlertShortcutAction(alertId, "Acknowledge");
      }
    }

    function onResolve(): void {
      if (!canMutateAlertInbox) {
        return;
      }

      const alertId = resolveFocusedAlertId();

      if (alertId !== null) {
        onAlertShortcutAction(alertId, "Resolve");
      }
    }

    function onSuppress(): void {
      if (!canMutateAlertInbox) {
        return;
      }

      const alertId = resolveFocusedAlertId();

      if (alertId !== null) {
        onAlertShortcutAction(alertId, "Suppress");
      }
    }

    window.addEventListener(COMMAND_PALETTE_ALERT_NEXT_EVENT, onNext);
    window.addEventListener(COMMAND_PALETTE_ALERT_PREV_EVENT, onPrev);
    window.addEventListener(COMMAND_PALETTE_ALERT_ACKNOWLEDGE_EVENT, onAcknowledge);
    window.addEventListener(COMMAND_PALETTE_ALERT_RESOLVE_EVENT, onResolve);
    window.addEventListener(COMMAND_PALETTE_ALERT_SUPPRESS_EVENT, onSuppress);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_ALERT_NEXT_EVENT, onNext);
      window.removeEventListener(COMMAND_PALETTE_ALERT_PREV_EVENT, onPrev);
      window.removeEventListener(COMMAND_PALETTE_ALERT_ACKNOWLEDGE_EVENT, onAcknowledge);
      window.removeEventListener(COMMAND_PALETTE_ALERT_RESOLVE_EVENT, onResolve);
      window.removeEventListener(COMMAND_PALETTE_ALERT_SUPPRESS_EVENT, onSuppress);
    };
  }, [canMutateAlertInbox, onAlertShortcutAction]);

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
    allVisibleSelected,
    archiveBusyAlertId,
    batchAckBusy,
    clearPendingAction,
    closeActionLoopDialog,
    onAcknowledgeSelected,
    onArchiveAlert,
    onConfirmActionDialog,
    openRoutingDelivery,
    pendingAction,
    queuePendingAction,
    selectedAlertIds,
    setActionComment,
    toggleAlertSelected,
    toggleSelectAllVisible,
  };
}
