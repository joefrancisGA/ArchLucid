import { AlertsInboxAlertCard } from "@/components/alerts/AlertsInboxAlertCard";
import { AlertsTriageFirstOpenAlertStrip } from "@/components/alerts/AlertsTriageFirstOpenAlertStrip";
import { AlertsInboxListStates } from "@/components/alerts/AlertsInboxListStates";
import { resolveAlertsInboxTriageFirstAlert } from "@/lib/resolve-alerts-inbox-triage-first-alert";
import { AlertsInboxPagination } from "@/components/alerts/AlertsInboxPagination";
import { AlertsInboxVirtualizedAlertList } from "@/components/alerts/AlertsInboxVirtualizedAlertList";
import { shouldVirtualizeAlertsInboxList } from "@/components/alerts/alerts-inbox-virtualization";
import type { AlertsInboxController } from "@/components/alerts/use-alerts-inbox-controller";
import type { AlertRecord } from "@/types/alerts";

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
    selectedAlertIds,
    toggleAlertSelected,
    visibleAlerts,
  } = controller;

  const showPagination =
    !loading &&
    failure === null &&
    (visibleAlerts.length > 0 || canGoPrevious || hasMore);
  const triageFirstAlert = resolveAlertsInboxTriageFirstAlert(visibleAlerts);

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

      {triageFirstAlert !== null ? (
        <AlertsTriageFirstOpenAlertStrip
          target={triageFirstAlert}
          canAcknowledge={canMutateAlertInbox}
          onAcknowledge={queuePendingAction}
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
              onPendingAction={queuePendingAction}
              onArchiveAlert={(alertId) => {
                void onArchiveAlert(alertId);
              }}
              onOpenRoutingDelivery={openRoutingDelivery}
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
              onPendingAction={queuePendingAction}
              onArchiveAlert={(alertId) => {
                void onArchiveAlert(alertId);
              }}
              onOpenRoutingDelivery={openRoutingDelivery}
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
