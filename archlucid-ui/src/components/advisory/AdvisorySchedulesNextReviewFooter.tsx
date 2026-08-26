import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type AdvisorySchedulesNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open advisory schedules for the next review. */
export function AdvisorySchedulesNextReviewFooter(
  props: AdvisorySchedulesNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="advisory-schedules-next-review-footer"
      aria-label="Next review advisory schedules"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review advisory schedules</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="advisory-schedules-next-review-action"
      >
        <Link href={props.target.href}>Open next schedules</Link>
      </Button>
    </section>
  );
}

export function advisorySchedulesNextReviewHref(runId: string): string {
  return buildAdvisoryHubHref({ tab: "schedules", runId });
}
