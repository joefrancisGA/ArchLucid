"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildInviteReviewerHref, INVITE_REVIEWER_PAGE_TITLE } from "@/lib/invite-reviewer-flow";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { cn } from "@/lib/utils";

export type ReviewPackageAfterFinalizeNextStepsStripProps = {
  readonly runId: string;
  readonly priorRunId?: string | null;
};

/** Post-finalize quick links for sharing, comparing, and sponsor reporting. */
export function ReviewPackageAfterFinalizeNextStepsStrip(
  props: ReviewPackageAfterFinalizeNextStepsStripProps,
): React.JSX.Element {
  const runId = props.runId.trim();
  const priorRunId = props.priorRunId?.trim() ?? "";
  const compareHref =
    priorRunId.length > 0 ? comparePageHrefAdaptive(priorRunId, runId) : comparePageHrefAdaptive("", runId);

  return (
    <section
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="review-package-after-finalize-next-steps-strip"
      aria-labelledby="review-package-after-finalize-next-steps-heading"
    >
      <div className="min-w-0">
        <h2
          id="review-package-after-finalize-next-steps-heading"
          className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        >
          Do this next
        </h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          This review is finalized — share it, compare drift, or open the sponsor report.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" asChild data-testid="review-package-after-finalize-invite">
          <Link href={buildInviteReviewerHref(runId)}>{INVITE_REVIEWER_PAGE_TITLE}</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild data-testid="review-package-after-finalize-compare">
          <Link href={compareHref}>Compare reviews</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild data-testid="review-package-after-finalize-sponsor-report">
          <Link href={`${SPONSOR_REPORT_PATH}?runId=${encodeURIComponent(runId)}`}>Open sponsor report</Link>
        </Button>
      </div>
    </section>
  );
}
