import Link from "next/link";

import {
  isRunApprovedPackage,
  isRunApprovedWithMonitoringPackage,
  resolveRunHomeStatusTag,
  runListPrimaryTitle,
} from "@/components/operator-home/runs-dashboard-helpers";
import { ReviewListDisplayTitle } from "@/components/operator-home/ReviewListDisplayTitle";
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
  OPERATOR_HOME_YOUR_WORK_COLUMN_CREATED,
  OPERATOR_HOME_YOUR_WORK_COLUMN_NAME,
  OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS,
  OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED,
  OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatRunHomeListUpdatedLabel,
  runHomeListUsesCreatedTimestampFallback,
} from "@/lib/operator/operator-home-run-list-insight";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeRecentReviewsTableProps = {
  readonly runs: readonly RunSummary[];
  /** When set, hides the row Continue action for the hero-owned resume target (P1-11). */
  readonly suppressContinueForRunId?: string;
  /** Total tenant rows in the preview pool when more than `runs.length` are available. */
  readonly remainingReviewCount?: number;
  readonly onShowAllReviews?: () => void;
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

  const timestampColumnLabel = runHomeListUsesCreatedTimestampFallback(props.runs)
    ? OPERATOR_HOME_YOUR_WORK_COLUMN_CREATED
    : OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED;

  return (
    <div className="space-y-2" data-testid="operator-home-recent-reviews-table-wrapper">
      <EnterpriseTable ariaLabel="Recent reviews" data-testid="operator-home-recent-reviews-table">
        <colgroup>
          <col className="w-[52%]" />
          <col className="w-[18%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
        </colgroup>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_NAME}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{timestampColumnLabel}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className="text-right">Action</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.runs.map((run) => {
            const runId = run.runId ?? "";
            const href = `/architecture/reviews/${encodeURIComponent(runId)}`;
            const title = runListPrimaryTitle(run);
            const statusTag = resolveRunHomeStatusTag(run);
            const updatedPresentation = formatRunHomeListUpdatedLabel(run, "home-recent-reviews");
            const isExampleReview = isExampleReviewRow(run);
            const actionLabel = resolveRecentReviewRowActionLabel(run);
            const suppressContinueAction =
              props.suppressContinueForRunId !== undefined &&
              props.suppressContinueForRunId.trim().length > 0 &&
              runId === props.suppressContinueForRunId;

            return (
              <EnterpriseTableRow key={runId} data-testid={`operator-home-recent-review-row-${runId}`}>
                <EnterpriseTableCell>
                  <div className="flex min-w-0 items-start gap-2">
                    {isExampleReview ? <DemoDataBadge className="shrink-0" /> : null}
                    <ReviewListDisplayTitle
                      href={href}
                      title={title}
                      className="line-clamp-2"
                    />
                  </div>
                </EnterpriseTableCell>
                <EnterpriseTableCell className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {updatedPresentation !== null ? (
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <time dateTime={updatedPresentation.isoUtc} className="text-al-text-primary">
                        {updatedPresentation.absoluteLabel}
                      </time>
                      <span className="text-al-text-secondary">{updatedPresentation.relativeLabel}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag kind={statusTag.kind} label={statusTag.label} />
                </EnterpriseTableCell>
                <EnterpriseTableCell className="text-right">
                  {suppressContinueAction ? (
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} aria-hidden="true">
                      —
                    </span>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <Link href={href}>{actionLabel}</Link>
                    </Button>
                  )}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
      {props.remainingReviewCount !== undefined && props.remainingReviewCount > 0 ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          {props.onShowAllReviews !== undefined ? (
            <button
              type="button"
              className={cn("font-semibold", OPERATOR_LINK.nav)}
              data-testid="operator-home-recent-reviews-show-remaining"
              onClick={props.onShowAllReviews}
            >
              Show all {props.remainingReviewCount + props.runs.length} reviews
            </button>
          ) : (
            <Link
              href="/architecture/reviews"
              className={cn("font-semibold", OPERATOR_LINK.nav)}
              data-testid="operator-home-recent-reviews-show-remaining"
            >
              Show all {props.remainingReviewCount + props.runs.length} reviews
            </Link>
          )}
        </p>
      ) : null}
    </div>
  );
}
