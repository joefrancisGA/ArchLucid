"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type RunsListContinueLastViewedRowProps = {
  readonly run: RunSummary;
  readonly variant?: "primary" | "outline";
};

/** Pinned continue row for the most recently viewed architecture review. */
export function RunsListContinueLastViewedRow(props: RunsListContinueLastViewedRowProps): React.JSX.Element {
  const href = `/architecture/reviews/${encodeURIComponent(props.run.runId)}`;
  const title = buyerFacingReviewTitleFromSummary(props.run);
  const buttonVariant = props.variant ?? "primary";

  return (
    <section
      aria-labelledby="runs-list-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="runs-list-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="runs-list-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed review
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{title}</span>
          </p>
        </div>
        <Button type="button" variant={buttonVariant} size="sm" asChild data-testid="runs-list-continue-last-viewed-open">
          <Link href={href}>Open review</Link>
        </Button>
      </div>
    </section>
  );
}
