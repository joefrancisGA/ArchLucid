import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type CompositeAlertRulesNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to combine alert rules for the next review. */
export function CompositeAlertRulesNextReviewFooter(
  props: CompositeAlertRulesNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="composite-alert-rules-next-review-footer"
      aria-label="Next review composite alert rules"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review composite rules</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="composite-alert-rules-next-review-action"
      >
        <Link href={props.target.href}>Open next composite rules</Link>
      </Button>
    </section>
  );
}

export function compositeAlertRulesNextReviewHref(runId: string): string {
  return governanceAlertRulesTabHref("advanced-rules", runId.trim());
}
