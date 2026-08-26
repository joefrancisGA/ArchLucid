"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { patternLibraryDetailHref } from "@/lib/pattern-library-route";
import type { PatternLibraryRecord } from "@/lib/pattern-library-types";
import { cn } from "@/lib/utils";

export type PatternLibraryContinueLastViewedRowProps = {
  readonly record: PatternLibraryRecord;
  readonly scopedRunId?: string;
};

/** Pinned continue row for the most recently viewed architecture pattern. */
export function PatternLibraryContinueLastViewedRow(
  props: PatternLibraryContinueLastViewedRowProps,
): React.JSX.Element {
  const href = patternLibraryDetailHref(props.record.patternKey, props.scopedRunId);

  return (
    <section
      aria-labelledby="pattern-library-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="pattern-library-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="pattern-library-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed pattern
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.record.name}</span>
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="pattern-library-continue-last-viewed-open">
          <Link href={href}>Open pattern</Link>
        </Button>
      </div>
    </section>
  );
}
