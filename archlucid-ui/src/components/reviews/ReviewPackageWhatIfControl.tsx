"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useArchitectWorkspaceChrome } from "@/hooks/useArchitectWorkspaceChrome";
import { buildCompareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReviewPackageWhatIfControlProps = {
  readonly runId: string;
  readonly packageCommitted: boolean;
  readonly pipelineInFlight: boolean;
};

/**
 * Honest R12 what-if entry: compare from this review as base; ceteris-paribus branch is a new review run.
 */
export function ReviewPackageWhatIfControl(props: ReviewPackageWhatIfControlProps): ReactElement | null {
  const architectWorkspaceChrome = useArchitectWorkspaceChrome();
  const compareHref = buildCompareTwoReviewsHref({ baseRunId: props.runId });
  const disabled = !props.packageCommitted || props.pipelineInFlight;
  const disabledReason = props.pipelineInFlight
    ? "Analysis is still running — compare when the package is ready."
    : !props.packageCommitted
      ? "Compare opens after this review has a committed golden record."
      : null;

  if (!architectWorkspaceChrome) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>What-if</h4>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Start from this sealed package as the base. A true ceteris-paribus branch is a new architecture review
        with one field changed — it runs as a full billable review, then lands on Compare.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="default" disabled={disabled} asChild={!disabled}>
          {disabled ? (
            <span>{disabledReason}</span>
          ) : (
            <Link href={compareHref} data-testid="review-package-what-if-compare">
              Compare from this review
            </Link>
          )}
        </Button>
        <Link href="/architecture/create" className={OPERATOR_LINK.inline} data-testid="review-package-what-if-new-review">
          New review from snapshot
        </Link>
      </div>
    </div>
  );
}
