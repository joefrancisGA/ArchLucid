import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailWhatsNextSectionProps = {
  readonly runId: string;
};

/** Post-commit operator CTAs for the next review loop (assessment Tier 2 improvement 8). */
export function RunDetailWhatsNextSection(props: RunDetailWhatsNextSectionProps): ReactElement {
  const runId = props.runId.trim();
  const encodedRunId = encodeURIComponent(runId);
  const planNextReviewHref = `/architecture/reviews/new?sourceRunId=${encodedRunId}&mode=followup`;
  const compareHref = comparePageHrefAdaptive(runId);
  const replayHref = `/replay?runId=${encodedRunId}`;

  return (
    <section
      aria-label="What's next"
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="run-detail-whats-next"
    >
      <h3 className={cn("m-0 mb-2 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>What&apos;s next?</h3>
      <p className={cn("m-0 mb-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        This review is committed. Review the findings, then plan your next architecture check.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" asChild variant="outline" size="sm" data-testid="run-detail-plan-next-review">
          <Link href={planNextReviewHref}>Plan next review</Link>
        </Button>
        <Button type="button" asChild variant="outline" size="sm" data-testid="run-detail-compare-review">
          <Link href={compareHref}>Compare with another review</Link>
        </Button>
        <Link
          href={replayHref}
          className={OPERATOR_LINK.nav}
          data-testid="run-detail-replay-review"
        >
          Validate review
        </Link>
      </div>
    </section>
  );
}
