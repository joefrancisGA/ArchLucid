import { AlertsInboxAlertCard } from "@/components/alerts/AlertsInboxAlertCard";
import { AlertsInboxContinueLastViewedRow } from "@/components/alerts/AlertsInboxContinueLastViewedRow";
import { AlertsTriageFirstOpenAlertStrip } from "@/components/alerts/AlertsTriageFirstOpenAlertStrip";
import { AlertsInboxListStates } from "@/components/alerts/AlertsInboxListStates";
import { resolveAlertsInboxTriageFirstAlert } from "@/lib/resolve-alerts-inbox-triage-first-alert";
import { resolveContinueLastAlert, writeAlertsInboxLastViewedId } from "@/lib/resolve-continue-last-alert";
import { alertPrimaryFindingDetailHref } from "@/lib/alert-finding-navigation";
import { AlertsInboxPagination } from "@/components/alerts/AlertsInboxPagination";
import { AlertsInboxVirtualizedAlertList } from "@/components/alerts/AlertsInboxVirtualizedAlertList";
import { shouldVirtualizeAlertsInboxList } from "@/components/alerts/alerts-inbox-virtualization";
import type { AlertsInboxController } from "@/components/alerts/use-alerts-inbox-controller";
import type { AlertRecord } from "@/types/alerts";
import { useMemo } from "react";

type EmptyFilteredProps = NonNullable<Parameters<typeof AlertsInboxListStates>[0]["emptyFilteredProps"]>;

export type AlertsInboxAlertListSectionProps = {
  readonly controller: AlertsInboxController;
  readonly emptyFilteredProps: EmptyFilteredProps;
};

export function AlertsInboxAlertListSection({ controller, emptyFilteredProps }: AlertsInboxAlertListSectionProps) {
  const {
    alerts,
    archiveBusyAlertId,
    buyerPolishedShell,
    canGoNext,
    canGoPrevious,
    canMutateAlertInbox,
    failure,
    goNextPage,
    goPreviousPage,
    hasMore,
    loading,
    onArchiveAlert,
    openRoutingDelivery,
    page,
    queuePendingAction,
    scopedRunFilterActive,
    scopedRunId,
    selectedAlertIds,
    toggleAlertSelected,
    visibleAlerts,
  } = controller;

  const showPagination =
    !loading &&
    failure === null &&
    (visibleAlerts.length > 0 || canGoPrevious || hasMore);
  const triageFirstAlert = resolveAlertsInboxTriageFirstAlert(visibleAlerts);
  const continueLastAlert = useMemo(() => resolveContinueLastAlert(visibleAlerts), [visibleAlerts]);

  function rememberAlert(alertId: string): void {
    writeAlertsInboxLastViewedId(alertId);
  }

  function openAlert(alertId: string): void {
    rememberAlert(alertId);
    document
      .querySelector(`[data-alert-id="${alertId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    const alert = visibleAlerts.find((candidate) => candidate.alertId === alertId);

    if (alert === undefined) {
      return;
    }

    const findingDetailHref = alertPrimaryFindingDetailHref(
      alert,
      scopedRunFilterActive ? scopedRunId : null,
    );
    openRoutingDelivery(alertId, findingDetailHref);
  }

  return (
    <div className="grid gap-3">
      <AlertsInboxListStates
        loading={loading}
        hasLoadFailure={failure !== null}
        visibleAlertCount={visibleAlerts.length}
        alertCount={alerts.length}
        emptyFilteredProps={emptyFilteredProps}
        workspaceScopeEmptyTeaching={controller.workspaceScopeEmptyTeaching}
      />

      {continueLastAlert !== null ? (
        <AlertsInboxContinueLastViewedRow target={continueLastAlert} onOpen={openAlert} />
      ) : null}

      {triageFirstAlert !== null ? (
        <AlertsTriageFirstOpenAlertStrip
          target={triageFirstAlert}
          canAcknowledge={canMutateAlertInbox}
          onAcknowledge={(alertId, action) => {
            rememberAlert(alertId);
            queuePendingAction(alertId, action);
          }}
        />
      ) : null}

      {visibleAlerts.length > 0
        ? shouldVirtualizeAlertsInboxList(visibleAlerts.length)
          ? (
            <AlertsInboxVirtualizedAlertList
              alerts={visibleAlerts}
              buyerPolishedShell={buyerPolishedShell}
              canMutateAlertInbox={canMutateAlertInbox}
              selectedAlertIds={selectedAlertIds}
              archiveBusyAlertId={archiveBusyAlertId}
              onToggleSelected={toggleAlertSelected}
              onPendingAction={(alertId, action) => {
                rememberAlert(alertId);
                queuePendingAction(alertId, action);
              }}
              onArchiveAlert={(alertId) => {
                rememberAlert(alertId);
                void onArchiveAlert(alertId);
              }}
              onOpenRoutingDelivery={(alertId, findingDetailHref) => {
                rememberAlert(alertId);
                openRoutingDelivery(alertId, findingDetailHref);
              }}
            />
          )
          : visibleAlerts.map((alert: AlertRecord) => (
            <AlertsInboxAlertCard
              key={alert.alertId}
              alert={alert}
              buyerPolishedShell={buyerPolishedShell}
              canMutateAlertInbox={canMutateAlertInbox}
              selected={selectedAlertIds.includes(alert.alertId)}
              archiveBusyAlertId={archiveBusyAlertId}
              onToggleSelected={toggleAlertSelected}
              onPendingAction={(alertId, action) => {
                rememberAlert(alertId);
                queuePendingAction(alertId, action);
              }}
              onArchiveAlert={(alertId) => {
                rememberAlert(alertId);
                void onArchiveAlert(alertId);
              }}
              onOpenRoutingDelivery={(alertId, findingDetailHref) => {
                rememberAlert(alertId);
                openRoutingDelivery(alertId, findingDetailHref);
              }}
            />
          ))
        : null}

      {showPagination ? (
        <AlertsInboxPagination
          page={page}
          shownCount={visibleAlerts.length}
          hasMore={hasMore}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          canMutateAlertInbox={canMutateAlertInbox}
          onPrevious={goPreviousPage}
          onNext={goNextPage}
        />
      ) : null}
    </div>
  );
}
