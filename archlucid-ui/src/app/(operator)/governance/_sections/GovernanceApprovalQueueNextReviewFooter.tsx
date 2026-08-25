import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceApprovalQueueHref } from "@/lib/governance/governance-route-paths";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type GovernanceApprovalQueueNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open the approval queue for the next review. */
export function GovernanceApprovalQueueNextReviewFooter(
  props: GovernanceApprovalQueueNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="governance-approval-queue-next-review-footer"
      aria-label="Next review approval queue"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review approval queue</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="governance-approval-queue-next-review-action">
        <Link href={props.target.href}>Open next approval queue</Link>
      </Button>
    </section>
  );
}

export function governanceApprovalQueueNextReviewHref(runId: string): string {
  return governanceApprovalQueueHref(runId);
}
