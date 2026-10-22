import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { patternLibraryHref } from "@/lib/pattern-library-route";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type PatternLibraryNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to browse the pattern library for the next review. */
export function PatternLibraryNextReviewFooter(props: PatternLibraryNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="pattern-library-next-review-footer"
      aria-label="Next review pattern library"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review pattern library</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="pattern-library-next-review-action"
      >
        <Link href={props.target.href}>Browse next patterns</Link>
      </Button>
    </section>
  );
}

export function patternLibraryNextReviewHref(runId: string): string {
  return patternLibraryHref({ runId: runId.trim() });
}
