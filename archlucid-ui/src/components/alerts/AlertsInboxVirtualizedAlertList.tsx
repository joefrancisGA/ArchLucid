"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import { AlertsInboxAlertCard } from "@/components/alerts/AlertsInboxAlertCard";
import type { AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { ALERTS_INBOX_CARD_ROW_ESTIMATE_PX } from "@/components/alerts/alerts-inbox-virtualization";
import type { AlertRecord } from "@/types/alerts";

export type AlertsInboxVirtualizedAlertListProps = {
  readonly alerts: readonly AlertRecord[];
  readonly buyerPolishedShell: boolean;
  readonly canMutateAlertInbox: boolean;
  readonly selectedAlertIds: readonly string[];
  readonly archiveBusyAlertId: string | null;
  readonly onToggleSelected: (alertId: string, checked: boolean) => void;
  readonly onPendingAction: (alertId: string, action: AlertActionKind) => void;
  readonly onArchiveAlert: (alertId: string) => void;
  readonly onOpenRoutingDelivery: (alertId: string, findingDetailHref: string | null) => void;
};

export function AlertsInboxVirtualizedAlertList(props: AlertsInboxVirtualizedAlertListProps): React.JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: props.alerts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ALERTS_INBOX_CARD_ROW_ESTIMATE_PX,
    overscan: 4,
  });

  return (
    <div
      ref={parentRef}
      className="max-h-[min(40rem,70vh)] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800"
      data-testid="alerts-inbox-virtualized-list"
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const alert = props.alerts[virtualRow.index];

          return (
            <div
              key={alert.alertId}
              className="absolute left-0 top-0 w-full px-1 pb-3"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <AlertsInboxAlertCard
                alert={alert}
                buyerPolishedShell={props.buyerPolishedShell}
                canMutateAlertInbox={props.canMutateAlertInbox}
                selected={props.selectedAlertIds.includes(alert.alertId)}
                archiveBusyAlertId={props.archiveBusyAlertId}
                onToggleSelected={props.onToggleSelected}
                onPendingAction={props.onPendingAction}
                onArchiveAlert={props.onArchiveAlert}
                onOpenRoutingDelivery={props.onOpenRoutingDelivery}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
