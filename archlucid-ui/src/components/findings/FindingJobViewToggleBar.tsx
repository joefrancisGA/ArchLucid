"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  countGovernanceRowsForJobView,
  countReviewFindingsForJobView,
  DEFAULT_FINDING_JOB_VIEW,
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

const SECONDARY_JOB_VIEW_OPTIONS = JOB_VIEW_OPTIONS.filter((option) => option !== DEFAULT_FINDING_JOB_VIEW);

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

function JobViewToggleButton(props: {
  readonly option: FindingJobView;
  readonly active: boolean;
  readonly count: number;
  readonly onSelect: (jobView: FindingJobView) => void;
}): React.JSX.Element {
  return (
    <button
      key={props.option}
      type="button"
      className={cn(
        "rounded-md px-2 py-1 text-sm",
        props.active
          ? "bg-neutral-800 font-semibold text-white dark:bg-neutral-600"
          : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700",
      )}
      aria-pressed={props.active}
      data-testid={`finding-job-view-${props.option}`}
      onClick={() => {
        props.onSelect(props.option);
      }}
    >
      {FINDING_JOB_VIEW_LABELS[props.option]} ({props.count})
    </button>
  );
}

/** TB-2179: job-shaped finding view toggles (client filter only). */
export function FindingJobViewToggleBar(props: FindingJobViewToggleBarProps): React.JSX.Element {
  const [showMoreJobViews, setShowMoreJobViews] = useState(
    () => props.jobView !== DEFAULT_FINDING_JOB_VIEW,
  );
  const primaryCount = countForJobView(
    DEFAULT_FINDING_JOB_VIEW,
    props.reviewFindings,
    props.governanceRows,
  );

  return (
    <div className="space-y-2" data-testid="finding-job-view-toggle-bar">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Finding job views">
        <JobViewToggleButton
          option={DEFAULT_FINDING_JOB_VIEW}
          active={props.jobView === DEFAULT_FINDING_JOB_VIEW}
          count={primaryCount}
          onSelect={props.onJobViewChange}
        />
        {showMoreJobViews ? (
          SECONDARY_JOB_VIEW_OPTIONS.map((option) => (
            <JobViewToggleButton
              key={option}
              option={option}
              active={props.jobView === option}
              count={countForJobView(option, props.reviewFindings, props.governanceRows)}
              onSelect={props.onJobViewChange}
            />
          ))
        ) : (
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-sm text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100 dark:text-neutral-200 dark:ring-neutral-700",
            )}
            data-testid="finding-job-view-more-toggle"
            onClick={() => {
              setShowMoreJobViews(true);
            }}
          >
            More job views
          </button>
        )}
      </div>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Severity filters below refine the active job view.
      </p>
    </div>
  );
}
