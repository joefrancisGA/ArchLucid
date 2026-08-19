import Link from "next/link";
import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { findingJobViewLaneLead } from "@/lib/findings/finding-job-view-lane-lead";
import { buildReviewFindingsTabHref } from "@/lib/findings/review-findings-job-view-url";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingJobViewLaneCalloutProps = {
  readonly jobView: FindingJobView;
  readonly runId?: string;
};

/** TB-2315 / TB-2179 — surfaces triage lane on finding detail and inspect (parity with findings workspace). */
export function FindingJobViewLaneCallout(props: FindingJobViewLaneCalloutProps): React.JSX.Element | null {
  if (props.jobView === DEFAULT_FINDING_JOB_VIEW) {
    return null;
  }

  const runId = props.runId?.trim() ?? "";
  const findingsLaneHref = runId.length > 0 ? buildReviewFindingsTabHref(runId, props.jobView) : null;

  return (
    <div
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="finding-job-view-lane-callout"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
          Triage lane
        </span>
        <StatusTag kind="neutral" label={FINDING_JOB_VIEW_LABELS[props.jobView]} />
      </div>
      <p className={cn("m-0 mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {findingJobViewLaneLead(props.jobView)}
      </p>
      {findingsLaneHref !== null ? (
        <p className="m-0 mt-2">
          <Link
            href={findingsLaneHref}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid="finding-job-view-lane-open-list"
          >
            Open this lane on the findings list
          </Link>
        </p>
      ) : null}
    </div>
  );
}
