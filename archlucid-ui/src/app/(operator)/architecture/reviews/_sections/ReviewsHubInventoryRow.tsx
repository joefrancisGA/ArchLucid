"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import {
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import type { ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

import { ReviewsHubInventoryRowActions } from "./ReviewsHubInventoryRowActions";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import { reviewsHubOverallStatusTagKind } from "./reviews-hub-review-status";

const PINNED_COLUMN_CLASS = "w-10 px-2";
const REVIEW_TITLE_COLUMN_CLASS =
  "min-w-[12rem] max-w-[18rem] lg:sticky lg:left-10 lg:z-[2] lg:bg-al-surface-raised";
const STATUS_COLUMN_CLASS = "min-w-[6.5rem] lg:sticky lg:left-[calc(2.5rem+12rem)] lg:z-[2] lg:bg-al-surface-raised";

export type ReviewsHubInventoryRowProps = {
  readonly run: RunSummary;
  readonly ownerContext: ReviewPackageOwnerResolutionContext;
  readonly siblingRuns: readonly RunSummary[];
  readonly isWorkingMode?: boolean;
  readonly style?: CSSProperties;
};

export function ReviewsHubInventoryRow(props: ReviewsHubInventoryRowProps): React.JSX.Element {
  const row = toReviewsHubReviewRowDisplay(props.run, props.ownerContext, props.siblingRuns, {
    isWorkingMode: props.isWorkingMode === true,
  });

  return (
    <EnterpriseTableRow
      data-testid={row.isSampleReview ? "reviews-hub-sample-row" : `reviews-hub-row-${row.runId}`}
      style={props.style}
    >
      <EnterpriseTableCell className={PINNED_COLUMN_CLASS}>
        <FavoriteReviewToggle runId={row.runId} title={row.reviewTitlePrimary} />
      </EnterpriseTableCell>
      <EnterpriseTableCell className={REVIEW_TITLE_COLUMN_CLASS}>
        <div className="min-w-[12rem]">
          <Link
            href={row.reviewHref}
            className={cn(OPERATOR_LINK.nav, "font-medium")}
            aria-label={`Open review ${row.reviewTitlePrimary}`}
            data-testid={`reviews-hub-primary-action-${row.runId}`}
          >
            {row.reviewTitlePrimary}
          </Link>
          {row.reviewTitleKindLabel !== null ? (
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {row.reviewTitleKindLabel}
            </p>
          ) : null}
          {row.isSampleReview ? (
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Sample review
            </p>
          ) : null}
        </div>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        {row.architectureDeskHref !== null ? (
          <Link
            href={row.architectureDeskHref}
            className={cn(OPERATOR_LINK.nav, "font-medium text-al-text-primary")}
            aria-label={`Open architecture desk for ${row.architectureName}`}
            data-testid={`reviews-hub-architecture-desk-${row.runId}`}
          >
            {row.architectureName}
          </Link>
        ) : (
          <span className="font-medium text-al-text-primary">{row.architectureName}</span>
        )}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={STATUS_COLUMN_CLASS}>
        <StatusTag
          kind={reviewsHubOverallStatusTagKind(row.overallStatus, row.needsAttention)}
          label={row.overallStatus}
        />
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.governanceState}</span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <span className="text-al-text-primary">{row.lifecycleStage}</span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>{row.ownerLabel}</EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary} title={row.lastUpdatedAbsolute}>
        {row.lastUpdated}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.findingsCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.riskCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <ReviewsHubInventoryRowActions run={props.run} row={row} />
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}
