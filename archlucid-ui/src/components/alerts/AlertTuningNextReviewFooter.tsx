import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { alertSimulationNextReviewHref } from "@/components/alerts/AlertSimulationNextReviewFooter";
import { cn } from "@/lib/utils";

export type AlertTuningNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to continue alert tuning for the next review. */
export function AlertTuningNextReviewFooter(props: AlertTuningNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="alert-tuning-next-review-footer"
      aria-label="Next review alert tuning"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review alert tuning</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="alert-tuning-next-review-action">
        <Link href={props.target.href}>Open next tuning</Link>
      </Button>
    </section>
  );
}

export function alertTuningNextReviewHref(runId: string): string {
  return alertSimulationNextReviewHref(runId);
}
