import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type AlertSimulationNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open alert simulation for the next review. */
export function AlertSimulationNextReviewFooter(props: AlertSimulationNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="alert-simulation-next-review-footer"
      aria-label="Next review alert simulation"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review alert simulation</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="alert-simulation-next-review-action">
        <Link href={props.target.href}>Open next simulation</Link>
      </Button>
    </section>
  );
}

export function alertSimulationNextReviewHref(runId: string): string {
  const params = new URLSearchParams();
  params.set("tab", "test-alerts");
  params.set("runId", runId.trim());

  return `${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`;
}
