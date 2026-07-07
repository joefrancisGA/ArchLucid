import { cn } from "@/lib/utils";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { ALERTS_INBOX_PAGE_SIZE } from "@/app/(operator)/alerts/_sections/load-alerts-inbox-page-model";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AlertsInboxListStatesProps = {
  readonly loading: boolean;
  readonly hasLoadFailure: boolean;
  readonly visibleAlertCount: number;
  readonly alertCount: number;
  readonly buyerPolishedShell: boolean;
  readonly emptyFilteredProps: EnterpriseCompactEmptyStateProps;
};

export function AlertsInboxListStates(props: AlertsInboxListStatesProps) {
  return (
    <>
      {props.loading && !props.hasLoadFailure && props.visibleAlertCount === 0 && props.alertCount === 0 ? (
        props.buyerPolishedShell === true ? (
          <div
            className={cn(
              "rounded-md border border-dashed border-neutral-200 px-4 py-4 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            <p className="m-0">Loading alerts…</p>
          </div>
        ) : (
          <OperatorLoadingNotice>
            <strong>Loading alerts.</strong>
            <p className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {ALERTS_INBOX_PAGE_SIZE} per page; empty means no rows for this filter.
            </p>
          </OperatorLoadingNotice>
        )
      ) : null}

      {!props.loading && !props.hasLoadFailure && props.visibleAlertCount === 0 ? (
        <EnterpriseCompactEmptyState {...props.emptyFilteredProps} />
      ) : null}
    </>
  );
}
