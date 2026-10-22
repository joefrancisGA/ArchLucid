import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { alertsPaginationNavTitleReaderRank } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AlertsInboxPaginationProps = {
  readonly page: number;
  readonly shownCount: number;
  readonly hasMore: boolean;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly canMutateAlertInbox: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
};

function formatAlertsInboxPaginationSummary(
  page: number,
  shownCount: number,
  hasMore: boolean,
): string {
  const alertWord = shownCount === 1 ? "alert" : "alerts";
  const shown = `Showing ${shownCount} ${alertWord}`;

  if (hasMore) {
    return `Page ${page} · ${shown} · more available`;
  }

  return `Page ${page} · ${shown}`;
}

export function AlertsInboxPagination(props: AlertsInboxPaginationProps) {
  const readerPaginationHintId = "alerts-inbox-pagination-reader-hint";
  const readerPaginationReason = props.canMutateAlertInbox
    ? null
    : {
        kind: "role" as const,
        message: alertsPaginationNavTitleReaderRank,
      };

  return (
    <nav
      className={cn("mt-4 flex flex-wrap items-center gap-4 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
      aria-label="Alerts pagination"
    >
      <span>
        {formatAlertsInboxPaginationSummary(props.page, props.shownCount, props.hasMore)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!props.canGoPrevious}
        aria-describedby={readerPaginationReason === null ? undefined : readerPaginationHintId}
        onClick={props.onPrevious}
      >
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!props.canGoNext}
        aria-describedby={readerPaginationReason === null ? undefined : readerPaginationHintId}
        onClick={props.onNext}
      >
        Next
      </Button>
      <WhyDisabledCtaHint
        id={readerPaginationHintId}
        reason={readerPaginationReason}
        testId={readerPaginationHintId}
      />
    </nav>
  );
}
