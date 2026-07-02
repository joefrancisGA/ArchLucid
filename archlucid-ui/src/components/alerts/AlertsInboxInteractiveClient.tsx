"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AlertsInboxRankCue } from "@/components/EnterpriseControlsContextHints";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { LayerHeader } from "@/components/LayerHeader";
import { AlertsInboxListStates } from "@/components/alerts/AlertsInboxListStates";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorTryNext } from "@/components/OperatorShellMessage";
import { useAlertsInboxEmptyFilteredProps } from "@/components/alerts/use-alerts-inbox-empty-filtered-props";
import {
  alertsPageLeadOperator,
  alertsPageLeadReader,
} from "@/lib/enterprise-controls-context-copy";
import { useAlertCardShortcuts } from "@/hooks/useAlertCardShortcuts";
import { useNavSurface } from "@/lib/use-nav-surface";
import {
  acknowledgeAlertsBatch,
  applyAlertAction,
  archiveAlert,
  fetchAlertActionLoop,
  listAlertsPaged,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { shouldMergeOperatorDemoAlertSample, tryStaticDemoAlertInboxRow } from "@/lib/operator-static-demo";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { AlertActionLoopDto } from "@/types/operate-rhythm";
import type { AlertRecord } from "@/types/alerts";

import { AlertsInboxAlertCard, type AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { AlertsInboxControls } from "@/components/alerts/AlertsInboxControls";
import { AlertsInboxActionLoopDialog, AlertsInboxTriageActionDialog } from "@/components/alerts/AlertsInboxDialogs";
import { AlertsInboxPagination } from "@/components/alerts/AlertsInboxPagination";
import type { AlertsInboxPageModel } from "@/app/(operator)/alerts/_sections/alerts-inbox-page-model";
import {
  ALERTS_INBOX_ALL_STATUSES_VALUE,
  ALERTS_INBOX_PAGE_SIZE,
} from "@/app/(operator)/alerts/_sections/load-alerts-inbox-page-model";


type PendingActionState = {
  alertId: string;
  action: AlertActionKind;
};

export type AlertsInboxInteractiveClientProps = {
  /** Server-loaded inbox snapshot for first paint (TB-564). */
  initialModel?: AlertsInboxPageModel | null;
};

export function AlertsInboxInteractiveClient({ initialModel = null }: AlertsInboxInteractiveClientProps = {}) {
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

  return (
    <div className="w-full max-w-3xl">
      <LayerHeader pageKey="alerts" />
      <div className="mb-0 flex flex-wrap items-center gap-2">
        <h2 className={cn("m-0 tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Alerts</h2>
      </div>
      <p className={cn("max-w-prose leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {canMutateAlertInbox ? alertsPageLeadOperator : alertsPageLeadReader}
      </p>
      <p className={cn("mt-2 max-w-prose leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Deduplicated architecture-risk alerts in this workspace. Acknowledge or resolve items tied to findings in scope.
        Each card links a risk signal to a <GlossaryTooltip termKey="findings">finding</GlossaryTooltip> in scope so
        you can triage, acknowledge, or resolve.
      </p>
      {!canMutateAlertInbox ? <AlertsInboxRankCue /> : null}

      {buyerPolishedShell && shouldMergeOperatorDemoAlertSample() ? (
        <div
          className={cn(
            "mb-4 max-w-prose rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          <strong className="font-semibold">Sample inbox.</strong> This alert ties drift detection to the PHI minimization
          finding — controls below stay read-only in this walkthrough.
        </div>
      ) : null}

      {failure !== null ? (
        <div className="mb-4" role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
          <OperatorTryNext>
            Confirm the API and proxy are up, then click <strong>Refresh</strong>. Alerts come from scheduled scans—if
            the list should not be empty, check worker schedules and open <Link className={OPERATOR_LINK.nav} href="/help">Help</Link>{" "}
            for environment guidance.
          </OperatorTryNext>
        </div>
      ) : null}

      <AlertsInboxControls
        status={status}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        loading={loading}
        buyerPolishedShell={buyerPolishedShell}
        canMutateAlertInbox={canMutateAlertInbox}
        visibleAlertCount={visibleAlerts.length}
        selectedAlertCount={selectedAlertIds.length}
        batchAckBusy={batchAckBusy}
        allVisibleSelected={allVisibleSelected}
        pageMixSummary={pageMixSummary}
        hasLoadFailure={failure !== null}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onRefresh={() => {
          void load();
        }}
        onAcknowledgeSelected={() => {
          void onAcknowledgeSelected();
        }}
        onToggleSelectAllVisible={toggleSelectAllVisible}
      />

      <div className="grid gap-3">
        <AlertsInboxListStates
          loading={loading}
          hasLoadFailure={failure !== null}
          visibleAlertCount={visibleAlerts.length}
          alertCount={alerts.length}
          buyerPolishedShell={buyerPolishedShell}
          emptyFilteredProps={emptyFilteredProps}
        />

        {visibleAlerts.length > 0
          ? visibleAlerts.map((alert) => (
              <AlertsInboxAlertCard
                key={alert.alertId}
                alert={alert}
                buyerPolishedShell={buyerPolishedShell}
                canMutateAlertInbox={canMutateAlertInbox}
                selected={selectedAlertIds.includes(alert.alertId)}
                archiveBusyAlertId={archiveBusyAlertId}
                onToggleSelected={toggleAlertSelected}
                onPendingAction={(alertId, action) => {
                  setPendingAction({ alertId, action });
                  setActionComment("");
                }}
                onArchiveAlert={(alertId) => {
                  void onArchiveAlert(alertId);
                }}
                onOpenRoutingDelivery={openRoutingDelivery}
              />
            ))
          : null}

        {!loading && failure === null && totalCount > 0 ? (
          <AlertsInboxPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            canMutateAlertInbox={canMutateAlertInbox}
            onPrevious={() => {
              setPage((p) => Math.max(1, p - 1));
            }}
            onNext={() => {
              setPage((p) => Math.min(totalPages, p + 1));
            }}
          />
        ) : null}
      </div>

      <AlertsInboxTriageActionDialog
        pendingAction={pendingAction}
        actionComment={actionComment}
        actionBusy={actionBusy}
        canMutateAlertInbox={canMutateAlertInbox}
        onActionCommentChange={setActionComment}
        onClose={() => {
          setPendingAction(null);
          setActionComment("");
        }}
        onConfirm={() => {
          void onConfirmActionDialog();
        }}
      />

      <AlertsInboxActionLoopDialog
        actionLoopAlertId={actionLoopAlertId}
        actionLoopFindingHref={actionLoopFindingHref}
        actionLoopData={actionLoopData}
        actionLoopLoading={actionLoopLoading}
        actionLoopError={actionLoopError}
        onClose={() => {
          setActionLoopAlertId(null);
          setActionLoopFindingHref(null);
          setActionLoopData(null);
          setActionLoopError(null);
        }}
      />
    </div>
  );
}
