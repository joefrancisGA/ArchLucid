import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { recurrenceSchedulesNextReviewHref } from "@/lib/governance/recurrence-schedules-route";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type RecurrenceSchedulesNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to schedule recurrences for the next review. */
export function RecurrenceSchedulesNextReviewFooter(
  props: RecurrenceSchedulesNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="recurrence-schedules-next-review-footer"
      aria-label="Next review recurrence schedules"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review recurrence schedules</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="recurrence-schedules-next-review-action"
      >
        <Link href={props.target.href}>Open next schedules</Link>
      </Button>
    </section>
  );
}

export function recurrenceSchedulesNextReviewFooterHref(runId: string): string {
  return recurrenceSchedulesNextReviewHref(runId);
}
