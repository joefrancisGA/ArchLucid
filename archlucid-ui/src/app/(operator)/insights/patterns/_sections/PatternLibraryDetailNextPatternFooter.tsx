import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PatternLibraryDetailNextPatternTarget } from "@/lib/resolve-next-pattern-library-record";
import { cn } from "@/lib/utils";

export type PatternLibraryDetailNextPatternFooterProps = {
  readonly target: PatternLibraryDetailNextPatternTarget;
};

/** Footer CTA to continue with the next pattern in the library. */
export function PatternLibraryDetailNextPatternFooter(
  props: PatternLibraryDetailNextPatternFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="pattern-library-detail-next-pattern-footer"
      aria-label="Next pattern in library"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next pattern in library</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.name}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="pattern-library-detail-next-pattern-action"
      >
        <Link href={props.target.href}>Open next pattern</Link>
      </Button>
    </section>
  );
}
