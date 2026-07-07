import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";

import {
  REVIEWS_HUB_SUMMARY_COMMITTED_LABEL,
  REVIEWS_HUB_SUMMARY_FINDINGS_LABEL,
  REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL,
  REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL,
  REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL,
} from "./reviews-hub-copy";
import type { ReviewsWorkspaceSummary } from "./reviews-workspace-summary";

type ReviewsHubSummaryRowProps = {
  readonly summary: ReviewsWorkspaceSummary;
};

function SummaryMetric(props: { readonly label: string; readonly value: number }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {finiteIntegerCountDisplay(props.value)}
      </p>
    </div>
  );
}

/** Compact workspace posture row on `/reviews`. */
export function ReviewsHubSummaryRow(props: ReviewsHubSummaryRowProps): React.JSX.Element {
  const { summary } = props;

  return (
    <section
      className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      data-testid="reviews-hub-summary-row"
      aria-label="Workspace review summary"
    >
      <SummaryMetric label={REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL} value={summary.inProgress} />
      <SummaryMetric label={REVIEWS_HUB_SUMMARY_COMMITTED_LABEL} value={summary.committed} />
      <SummaryMetric label={REVIEWS_HUB_SUMMARY_FINDINGS_LABEL} value={summary.findings} />
      <SummaryMetric label={REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL} value={summary.openRisks} />
      <SummaryMetric label={REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL} value={summary.readyForGovernance} />
    </section>
  );
}
