"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GovernanceFindingsContinueLastTarget } from "@/lib/resolve-continue-last-governance-finding";
import { cn } from "@/lib/utils";

export type GovernanceFindingsContinueLastViewedRowProps = {
  readonly target: GovernanceFindingsContinueLastTarget;
};

/** Pinned continue row for the most recently viewed architecture finding. */
export function GovernanceFindingsContinueLastViewedRow(
  props: GovernanceFindingsContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="governance-findings-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="governance-findings-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="governance-findings-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed finding
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.title}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          asChild
          data-testid="governance-findings-continue-last-viewed-open"
        >
          <Link href={props.target.href}>Open finding</Link>
        </Button>
      </div>
    </section>
  );
}
