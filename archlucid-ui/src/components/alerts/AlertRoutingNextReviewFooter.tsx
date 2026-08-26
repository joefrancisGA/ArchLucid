import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type AlertRoutingNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to configure notification routing for the next review. */
export function AlertRoutingNextReviewFooter(props: AlertRoutingNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="alert-routing-next-review-footer"
      aria-label="Next review alert routing"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review notification routing</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="alert-routing-next-review-action">
        <Link href={props.target.href}>Open next routing</Link>
      </Button>
    </section>
  );
}

export function alertRoutingNextReviewHref(runId: string): string {
  return governanceAlertRulesTabHref("notifications", runId.trim());
}
