import { AlertsInboxAlertCard } from "@/components/alerts/AlertsInboxAlertCard";
import { AlertsInboxListStates } from "@/components/alerts/AlertsInboxListStates";
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
    canMutateAlertInbox,
    failure,
    loading,
    onArchiveAlert,
    openRoutingDelivery,
    page,
    queuePendingAction,
    selectedAlertIds,
    setPage,
    toggleAlertSelected,
    totalCount,
    totalPages,
    visibleAlerts,
  } = controller;

  return (
    <div className="grid gap-3">
      <AlertsInboxListStates
        loading={loading}
        hasLoadFailure={failure !== null}
        visibleAlertCount={visibleAlerts.length}
        alertCount={alerts.length}
        emptyFilteredProps={emptyFilteredProps}
      />

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
  );
}
