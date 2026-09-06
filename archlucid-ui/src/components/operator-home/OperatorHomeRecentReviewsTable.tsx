import Link from "next/link";

import {
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  resolveRunHomeStatusTag,
  runListPrimaryTitle,
} from "@/components/operator-home/runs-dashboard-helpers";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import {
  OPERATOR_HOME_OPEN_REVIEW_RECORD_CTA,
  OPERATOR_HOME_YOUR_WORK_COLUMN_NAME,
  OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS,
  OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED,
  OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRunHomeListUpdatedLabel } from "@/lib/operator/operator-home-run-list-insight";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeRecentReviewsTableProps = {
  readonly runs: readonly RunSummary[];
  /** When set, hides the row Continue action for the hero-owned resume target (P1-11). */
  readonly suppressContinueForRunId?: string;
};

function isExampleReviewRow(run: RunSummary): boolean {
  const runId = run.runId ?? "";

  return isShowcaseSampleOfAnyKind(runId) || isDemoSeededOverviewInjectedRun(run);
}

function resolveRecentReviewRowActionLabel(run: RunSummary): string {
  if (isRunApprovedPackage(run) || isRunApprovedWithMonitoringPackage(run)) {
    return OPERATOR_HOME_OPEN_REVIEW_RECORD_CTA;
  }

  return OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA;
}

/** Home recent-reviews preview table — columns aligned with Your work rail subgrid. */
export function OperatorHomeRecentReviewsTable(
  props: OperatorHomeRecentReviewsTableProps,
): React.JSX.Element | null {
  if (props.runs.length === 0) {
    return null;
  }

  return (
    <EnterpriseTable ariaLabel="Recent reviews" data-testid="operator-home-recent-reviews-table">
      <colgroup>
        <col className="w-[52%]" />
        <col className="w-[16%]" />
        <col className="w-[18%]" />
        <col className="w-[14%]" />
      </colgroup>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_NAME}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell className="text-right">Action</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.runs.map((run) => {
          const runId = run.runId ?? "";
          const href = `/architecture/reviews/${encodeURIComponent(runId)}`;
          const title = runListPrimaryTitle(run);
          const statusTag = resolveRunHomeStatusTag(run);
          const updatedPresentation = formatRunHomeListUpdatedLabel(run);
          const isExampleReview = isExampleReviewRow(run);
          const actionLabel = resolveRecentReviewRowActionLabel(run);
          const suppressContinueAction =
            props.suppressContinueForRunId !== undefined &&
            props.suppressContinueForRunId.trim().length > 0 &&
            runId === props.suppressContinueForRunId;

          return (
            <EnterpriseTableRow key={runId} data-testid={`operator-home-recent-review-row-${runId}`}>
              <EnterpriseTableCell className="max-w-0">
                <div className="flex min-w-0 items-start gap-2">
                  <Link
                    href={href}
                    className={cn("min-w-0 break-words font-medium leading-snug", OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}
                    aria-label={title}
                  >
                    {title}
                  </Link>
                  {isExampleReview ? <DemoDataBadge className="shrink-0" /> : null}
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={statusTag.kind} label={statusTag.label} />
              </EnterpriseTableCell>
              <EnterpriseTableCell className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {updatedPresentation !== null ? (
                  <span className="flex min-w-0 flex-col gap-0.5 sm:block">
                    <time dateTime={updatedPresentation.isoUtc} className="text-al-text-primary">
                      {updatedPresentation.absoluteLabel}
                    </time>
                    <span className="text-al-text-secondary sm:before:content-['_·_']">
                      {updatedPresentation.relativeLabel}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell className="text-right">
                {suppressContinueAction ? (
                  <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} aria-hidden="true">
                    —
                  </span>
                ) : (
                  <Button asChild variant="outline" size="sm" className="h-7">
                    <Link href={href}>{actionLabel}</Link>
                  </Button>
                )}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
