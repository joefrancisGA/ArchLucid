import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export type AlertsInboxListStatesProps = {
  readonly loading: boolean;
  readonly hasLoadFailure: boolean;
  readonly visibleAlertCount: number;
  readonly alertCount: number;
  readonly emptyFilteredProps: EnterpriseCompactEmptyStateProps;
};

function AlertsInboxListLoadingSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-3"
      data-testid="alerts-inbox-list-loading-skeleton"
      aria-busy="true"
      aria-label="Loading alerts"
    >
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
        <Skeleton className="h-5 w-full max-w-sm" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4 max-w-md" />
      </div>
    </div>
  );
}

export function AlertsInboxListStates(props: AlertsInboxListStatesProps) {
  return (
    <>
      {props.loading && !props.hasLoadFailure && props.visibleAlertCount === 0 && props.alertCount === 0 ? (
        <AlertsInboxListLoadingSkeleton />
      ) : null}

      {!props.loading && !props.hasLoadFailure && props.visibleAlertCount === 0 ? (
        <EnterpriseCompactEmptyState {...props.emptyFilteredProps} />
      ) : null}
    </>
  );
}
