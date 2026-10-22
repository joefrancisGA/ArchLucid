import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { writePlanningPickedReviewId } from "@/lib/planning-picked-review-storage";
import { PLANNING_PATH } from "@/lib/planning-route";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type PlanningNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open improvement planning for the next review. */
export function PlanningNextReviewFooter(props: PlanningNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="planning-next-review-footer"
      aria-label="Next review improvement planning"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review improvement planning</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="planning-next-review-action">
        <Link
          href={props.target.href}
          onClick={() => {
            writePlanningPickedReviewId(props.target.runId);
          }}
        >
          Open next planning
        </Link>
      </Button>
    </section>
  );
}

export function planningNextReviewHref(runId: string): string {
  return `${PLANNING_PATH}?runId=${encodeURIComponent(runId)}`;
}
