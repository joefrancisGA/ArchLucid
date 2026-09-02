"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { cn } from "@/lib/utils";

import {
  countGovernanceRowsForJobView,
  countReviewFindingsForJobView,
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { reviewFindingsJobViewHrefFromSearch } from "@/lib/findings/review-findings-job-view-url";
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

function JobViewToggleChip(props: {
  readonly option: FindingJobView;
  readonly active: boolean;
  readonly count: number;
  readonly href: string;
}): React.JSX.Element {
  return (
    <FilterChip
      href={props.href}
      scroll={false}
      className={buyerFilterChipClass(props.active, false)}
      aria-current={props.active ? "page" : undefined}
      data-testid={`finding-job-view-${props.option}`}
    >
      {FINDING_JOB_VIEW_LABELS[props.option]} ({props.count})
    </FilterChip>
  );
}

/** TB-2179: job-shaped finding view toggles (client filter only). */
export function FindingJobViewToggleBar(props: FindingJobViewToggleBarProps): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
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
      <FilterChipGroup aria-label="Finding job views" className="flex flex-wrap items-center gap-2">
        <JobViewToggleChip
          option={DEFAULT_FINDING_JOB_VIEW}
          active={props.jobView === DEFAULT_FINDING_JOB_VIEW}
          count={primaryCount}
          href={reviewFindingsJobViewHrefFromSearch(currentSearch, pathname, DEFAULT_FINDING_JOB_VIEW)}
        />
        {showMoreJobViews ? (
          SECONDARY_JOB_VIEW_OPTIONS.map((option) => (
            <JobViewToggleChip
              key={option}
              option={option}
              active={props.jobView === option}
              count={countForJobView(option, props.reviewFindings, props.governanceRows)}
              href={reviewFindingsJobViewHrefFromSearch(currentSearch, pathname, option)}
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
      </FilterChipGroup>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Severity filters below refine the active job view.
      </p>
    </div>
  );
}
