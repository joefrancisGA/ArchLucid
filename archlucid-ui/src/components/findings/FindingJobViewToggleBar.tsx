"use client";

import { cn } from "@/lib/utils";

import {
  countGovernanceRowsForJobView,
  countReviewFindingsForJobView,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

const JOB_VIEW_OPTIONS: readonly FindingJobView[] = [
  "needs-my-decision",
  "answer-these-questions",
  "verify-hypotheses",
  "resolve-contradictions",
  "coverage-gaps",
  "needs-governance",
  "ready-for-sponsor-packet",
  "deferred",
];

export type FindingJobViewToggleBarProps = {
  readonly jobView: FindingJobView;
  readonly onJobViewChange: (jobView: FindingJobView) => void;
  readonly reviewFindings?: readonly QuickDecisionFinding[];
  readonly governanceRows?: readonly GovernanceFindingQueueRow[];
};

function countForJobView(
  jobView: FindingJobView,
  reviewFindings: readonly QuickDecisionFinding[] | undefined,
  governanceRows: readonly GovernanceFindingQueueRow[] | undefined,
): number {
  if (reviewFindings !== undefined) {
    return countReviewFindingsForJobView(reviewFindings, jobView);
  }

  if (governanceRows !== undefined) {
    return countGovernanceRowsForJobView(governanceRows, jobView);
  }

  return 0;
}

/** TB-2179: job-shaped finding view toggles (client filter only). */
export function FindingJobViewToggleBar(props: FindingJobViewToggleBarProps): React.JSX.Element {
  return (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-label="Finding job views"
      data-testid="finding-job-view-toggle-bar"
    >
      {JOB_VIEW_OPTIONS.map((option) => {
        const active = props.jobView === option;
        const count = countForJobView(option, props.reviewFindings, props.governanceRows);

        return (
          <button
            key={option}
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-sm",
              active
                ? "bg-neutral-800 font-semibold text-white dark:bg-neutral-600"
                : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700",
            )}
            aria-pressed={active}
            data-testid={`finding-job-view-${option}`}
            onClick={() => {
              props.onJobViewChange(option);
            }}
          >
            {FINDING_JOB_VIEW_LABELS[option]} ({count})
          </button>
        );
      })}
      <p className={cn("m-0 w-full text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Severity filters below refine the active job view.
      </p>
    </div>
  );
}
