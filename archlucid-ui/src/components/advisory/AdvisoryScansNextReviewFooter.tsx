import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type AdvisoryScansNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open advisory scans for the next review. */
export function AdvisoryScansNextReviewFooter(props: AdvisoryScansNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="advisory-scans-next-review-footer"
      aria-label="Next review advisory scans"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review advisory scans</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="advisory-scans-next-review-action">
        <Link href={props.target.href}>Open next scans</Link>
      </Button>
    </section>
  );
}

export function advisoryScansNextReviewHref(runId: string): string {
  return buildAdvisoryHubHref({ tab: "scans", runId });
}
