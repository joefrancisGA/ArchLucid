import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type ProvenanceNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open provenance for the next review in the workspace list. */
export function ProvenanceNextReviewFooter(props: ProvenanceNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="provenance-next-review-footer"
      aria-label="Next package provenance"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next package provenance</p>
        <p
          className={cn("m-0 mt-1 line-clamp-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          title={props.target.reviewTitle}
        >
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="provenance-next-review-action">
        <Link href={props.target.href}>Open next package provenance</Link>
      </Button>
    </section>
  );
}
