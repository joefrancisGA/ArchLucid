import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactElement } from "react";

import { SampleReviewAhaMomentPanel } from "@/components/operator-home/SampleReviewAhaMomentPanel";
import { Button } from "@/components/ui/button";
import {
  BUYER_HOME_PRIMARY_CTA,
  BUYER_OPEN_SIGNED_RECORD_CTA,
  SAMPLE_REVIEW_PACKAGE_AHA_HEADING,
  SAMPLE_REVIEW_PACKAGE_AHA_LEAD,
  SAMPLE_REVIEW_AHA_DEMO_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { SHOWCASE_HOME_AHA_MOMENT, showcasePrimaryFindingHref } from "@/lib/showcase-home-aha-moment";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";

type SampleReviewPackageSummaryProps = {
  readonly runId: string;
  readonly manifestId?: string | null;
  readonly artifactCount: number;
  readonly findingCount: number | null;
};

/** Demo-only first-value summary for the curated sample review. */
export function SampleReviewPackageSummary({
  runId,
  manifestId,
  artifactCount,
  findingCount,
}: SampleReviewPackageSummaryProps): ReactElement {
  const findingCountDisplay = findingCount ?? SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;

  return (
    <div className="space-y-4" data-testid="sample-review-package-summary">
      <SampleReviewAhaMomentPanel
        moment={SHOWCASE_HOME_AHA_MOMENT}
        findingHref={showcasePrimaryFindingHref(runId)}
        ctaLabel={BUYER_HOME_PRIMARY_CTA}
        ctaTestId="sample-review-package-aha-open"
        heading={SAMPLE_REVIEW_PACKAGE_AHA_HEADING}
        lead={SAMPLE_REVIEW_PACKAGE_AHA_LEAD}
        demoLabel={SAMPLE_REVIEW_AHA_DEMO_LABEL}
      />

      <section
        aria-labelledby="sample-review-package-summary-heading"
        className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 p-4", OPERATOR_TYPOGRAPHY.body)}
      >
        <p className={cn("m-0 font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.helper)}>Sample review</p>
        <h2 id="sample-review-package-summary-heading" className="m-0 mt-1 text-lg font-semibold">
          Claims Intake sample review
        </h2>
        <p className={cn("m-0 mt-2 max-w-2xl leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
          Inspect the sealed review record, evidence trail, and audit record when you need the full package. Numbers are
          illustrative only and do not represent customer ROI without a live workspace.
        </p>

        <dl className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
            <dt className={cn("font-medium uppercase tracking-wide opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Review ID</dt>
            <dd className={cn("m-0 truncate font-mono", OPERATOR_TYPOGRAPHY.helper)}>{runId}</dd>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
            <dt className={cn("font-medium uppercase tracking-wide opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Findings</dt>
            <dd className="m-0 text-lg font-semibold">{findingCountDisplay}</dd>
            <p className={cn("m-0 opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Demo severity mix; inspect finding details below.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
            <dt className={cn("font-medium uppercase tracking-wide opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Artifacts</dt>
            <dd className="m-0 text-lg font-semibold">{artifactCount}</dd>
            <p className={cn("m-0 opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Generated outputs attached to the review.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-800 dark:bg-neutral-950/50">
            <dt className={cn("font-medium uppercase tracking-wide opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Evidence confidence</dt>
            <dd className="m-0 text-lg font-semibold">Demo only</dd>
            <p className={cn("m-0 opacity-80", OPERATOR_TYPOGRAPHY.helper)}>Connect a workspace for tenant proof.</p>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {manifestId ? (
            <Button asChild variant="outline" className="h-9 border-amber-300 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-700 dark:bg-neutral-950/60 dark:text-amber-100">
              <Link href={getShowcaseManifestHref()}>{BUYER_OPEN_SIGNED_RECORD_CTA}</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="h-9 border-amber-300 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-700 dark:bg-neutral-950/60 dark:text-amber-100">
            <Link href="/architecture/reviews/new">Start a real review</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
