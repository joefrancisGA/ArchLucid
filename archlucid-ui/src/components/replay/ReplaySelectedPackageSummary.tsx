"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatLastValidationOutcomeLabel,
  reviewPackageArchitectureName,
  reviewPackageFinalizedDateLabel,
  reviewPackageOwnerLabel,
  reviewPackageStatusLabel,
} from "@/lib/review-package-validation-picker";
import { replayValidationModeDefinition } from "@/lib/replay-validation-workflow";
import type { ReplayValidationOutcome } from "@/lib/replay-validation-workflow";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import type { RunSummary } from "@/types/authority";

export type ReplaySelectedPackageSummaryProps = {
  readonly selectedRun: RunSummary | null;
  readonly mode: string;
  readonly lastValidationOutcome: ReplayValidationOutcome | null;
};

export function ReplaySelectedPackageSummary(props: ReplaySelectedPackageSummaryProps) {
  const { selectedRun, mode, lastValidationOutcome } = props;
  const modeDefinition = replayValidationModeDefinition(mode);

  if (selectedRun === null) {
    return (
      <section
        aria-label="Selected package summary"
        className="rounded-md border border-dashed border-neutral-300 p-4 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
        data-testid="replay-selected-package-summary-empty"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Package details appear here after you select a finalized review.</p>
      </section>
    );
  }

  return (
    <section
      aria-label="Selected package summary"
      className="space-y-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="replay-selected-package-summary"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Selected package</h3>
      <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Architecture</dt>
          <dd className="m-0">{reviewPackageArchitectureName(selectedRun)}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review</dt>
          <dd className="m-0">
            <Link href={`/architecture/reviews/${selectedRun.runId}`} className={OPERATOR_LINK.nav}>
              {buyerFacingReviewTitleFromSummary(selectedRun)}
            </Link>
          </dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Finalized</dt>
          <dd className="m-0">{reviewPackageFinalizedDateLabel(selectedRun)}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Owner</dt>
          <dd className="m-0">{reviewPackageOwnerLabel(selectedRun)}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Status</dt>
          <dd className="m-0">{reviewPackageStatusLabel(selectedRun)}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Last validation</dt>
          <dd className="m-0">{formatLastValidationOutcomeLabel(lastValidationOutcome)}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Selected mode</dt>
          <dd className="m-0">{modeDefinition.title}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>AI budget impact</dt>
          <dd className="m-0">{modeDefinition.aiUsageLabel}</dd>
        </div>
        <div>
          <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Estimated duration</dt>
          <dd className="m-0">{modeDefinition.estimatedDurationLabel}</dd>
        </div>
      </dl>
    </section>
  );
}
