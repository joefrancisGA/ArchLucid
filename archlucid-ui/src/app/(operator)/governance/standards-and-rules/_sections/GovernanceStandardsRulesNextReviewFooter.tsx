import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type GovernanceStandardsRulesNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open standards and rules for the next review. */
export function GovernanceStandardsRulesNextReviewFooter(
  props: GovernanceStandardsRulesNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="standards-rules-next-review-footer"
      aria-label="Next review standards and rules"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review standards and rules</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="standards-rules-next-review-action">
        <Link href={props.target.href}>Open next standards</Link>
      </Button>
    </section>
  );
}

export function standardsRulesNextReviewHref(runId: string): string {
  return `${GOVERNANCE_STANDARDS_AND_RULES_PATH}?runId=${encodeURIComponent(runId)}`;
}
