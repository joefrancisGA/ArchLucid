"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildPilotOutcomesMostRecentFinalizedReviewHref,
  type PilotOutcomesEmptyDiagnostics,
} from "@/lib/pilot-outcomes-report-diagnostics";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";

type Props = {
  readonly diagnostics: PilotOutcomesEmptyDiagnostics;
  readonly onApplyPeriod: () => void;
  readonly periodBusy: boolean;
};

function formatOptionalDate(iso: string | null): string {
  if (iso === null) {
    return "None in this period";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "None in this period";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PilotOutcomesEmptyState(props: Props) {
  const { diagnostics } = props;
  const mostRecentFinalizedReviewHref = buildPilotOutcomesMostRecentFinalizedReviewHref(
    diagnostics.mostRecentFinalizedRunId,
  );

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="pilot-outcomes-empty-state"
      aria-labelledby="pilot-outcomes-empty-heading"
    >
      <h2 id="pilot-outcomes-empty-heading" className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>
        No finalized reviews in this reporting period
      </h2>
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Pilot outcomes are calculated from finalized reviews. Adjust the reporting period or finalize a review to
        generate this report.
      </p>

      <dl className={cn("mt-4 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-al-text-secondary">Selected reporting period</dt>
          <dd className="m-0 font-medium text-al-text-primary">{diagnostics.reportingPeriodLabel}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Finalized reviews</dt>
          <dd className="m-0 font-medium text-al-text-primary">{diagnostics.reviewsFinalized}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Reviews in detail sample</dt>
          <dd className="m-0 font-medium text-al-text-primary">{diagnostics.reviewsInTimeline}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Most recent finalized review</dt>
          <dd className="m-0 font-medium text-al-text-primary">
            {formatOptionalDate(diagnostics.mostRecentFinalizedUtc)}
          </dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Sample reviews included</dt>
          <dd className="m-0 font-medium text-al-text-primary">{diagnostics.includesSampleData ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Qualifying data in workspace</dt>
          <dd className="m-0 font-medium text-al-text-primary">
            {diagnostics.hasQualifyingData ? "Yes" : "No finalized reviews in period"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" variant="default" onClick={() => props.onApplyPeriod()} disabled={props.periodBusy}>
          Adjust reporting period
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href="/architecture/reviews?status=completed">View completed reviews</Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/architecture/reviews/new">{BUYER_START_ARCHITECTURE_REVIEW_CTA}</Link>
        </Button>
        {mostRecentFinalizedReviewHref !== null && diagnostics.reviewsInTimeline > 0 ? (
          <Link href={mostRecentFinalizedReviewHref} className={cn(OPERATOR_LINK.inline, "self-center")}>
            Open most recent finalized review
          </Link>
        ) : null}
      </div>
    </section>
  );
}
