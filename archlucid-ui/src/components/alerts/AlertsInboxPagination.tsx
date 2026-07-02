import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { alertsPaginationNavTitleReaderRank } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AlertsInboxPaginationProps = {
  readonly page: number;
  readonly totalPages: number;
  readonly totalCount: number;
  readonly canMutateAlertInbox: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
};

export function AlertsInboxPagination(props: AlertsInboxPaginationProps) {
  return (
    <nav
      className={cn("mt-4 flex flex-wrap items-center gap-4 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
      aria-label="Alerts pagination"
      title={props.canMutateAlertInbox ? undefined : alertsPaginationNavTitleReaderRank}
    >
      <span>
        Page {props.page} of {props.totalPages} · {props.totalCount} alert{props.totalCount === 1 ? "" : "s"} total
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.page <= 1}
        title={props.canMutateAlertInbox ? undefined : alertsPaginationNavTitleReaderRank}
        onClick={props.onPrevious}
      >
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={props.page >= props.totalPages}
        title={props.canMutateAlertInbox ? undefined : alertsPaginationNavTitleReaderRank}
        onClick={props.onNext}
      >
        Next
      </Button>
    </nav>
  );
}
