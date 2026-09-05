import Link from "next/link";

import {
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
  OPERATOR_HOME_YOUR_WORK_COLUMN_NAME,
  OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS,
  OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED,
  OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { isShowcaseSampleOfAnyKind } from "@/lib/demo-run-canonical";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRunHomeListUpdatedLabel } from "@/lib/operator/operator-home-run-list-insight";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeRecentReviewsTableProps = {
  readonly runs: readonly RunSummary[];
};

/** Home recent-reviews preview table — columns aligned with Your work rail subgrid. */
export function OperatorHomeRecentReviewsTable(
  props: OperatorHomeRecentReviewsTableProps,
): React.JSX.Element | null {
  if (props.runs.length === 0) {
    return null;
  }

  return (
    <EnterpriseTable ariaLabel="Recent reviews" data-testid="operator-home-recent-reviews-table">
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
          const updatedLabel = formatRunHomeListUpdatedLabel(run);
          const isExampleReview =
            isShowcaseSampleOfAnyKind(runId) || isDemoSeededOverviewInjectedRun(run);

          return (
            <EnterpriseTableRow key={runId} data-testid={`operator-home-recent-review-row-${runId}`}>
              <EnterpriseTableCell>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link
                    href={href}
                    className={cn("min-w-0 break-words font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                  >
                    {title}
                  </Link>
                  {isExampleReview ? <DemoDataBadge /> : null}
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={statusTag.kind} label={statusTag.label} />
              </EnterpriseTableCell>
              <EnterpriseTableCell className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {updatedLabel ?? "—"}
              </EnterpriseTableCell>
              <EnterpriseTableCell className="text-right">
                <Button asChild variant="outline" size="sm" className="h-7">
                  <Link href={href}>{OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA}</Link>
                </Button>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
