import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type PackagePrintNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to print the next review in the workspace list. */
export function PackagePrintNextReviewFooter(props: PackagePrintNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 print:hidden dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="package-print-next-review-footer"
      aria-label="Print next review in workspace"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Print next review</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="package-print-next-review-action">
        <Link href={props.target.href}>Print next review</Link>
      </Button>
    </section>
  );
}
