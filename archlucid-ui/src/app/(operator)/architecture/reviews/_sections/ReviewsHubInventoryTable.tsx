"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties } from "react";
import { useRef } from "react";

import { ReviewPinGlyph } from "@/components/reviews/ReviewPinGlyph";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
} from "@/components/ui/enterprise-table";
import type { ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RunSummary } from "@/types/authority";

import { ReviewsHubInventoryRow } from "./ReviewsHubInventoryRow";
import {
  REVIEWS_LIST_ROW_ESTIMATE_PX,
  shouldVirtualizeReviewsList,
} from "./reviews-list-virtualization";

const PINNED_COLUMN_CLASS = "w-10 px-2";
const REVIEW_TITLE_COLUMN_CLASS =
  "min-w-[12rem] max-w-[18rem] lg:sticky lg:left-10 lg:z-[2] lg:bg-al-surface-raised";
const STATUS_COLUMN_CLASS = "min-w-[6.5rem] lg:sticky lg:left-[calc(2.5rem+12rem)] lg:z-[2] lg:bg-al-surface-raised";

function ReviewsHubInventoryTableHead(): React.JSX.Element {
  return (
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow>
        <EnterpriseTableHeaderCell className={PINNED_COLUMN_CLASS}>
          <span className="sr-only">Pinned</span>
          <ReviewPinGlyph filled={false} className="h-3.5 w-3.5 text-al-text-secondary" />
        </EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className={REVIEW_TITLE_COLUMN_CLASS}>Review</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Architecture</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className={STATUS_COLUMN_CLASS}>Status</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Approval</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Updated</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Findings</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Risks</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Actions</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}

export type ReviewsHubInventoryTableProps = {
  readonly runs: readonly RunSummary[];
  readonly siblingRuns: readonly RunSummary[];
  readonly ownerContext: ReviewPackageOwnerResolutionContext;
  readonly ariaLabel: string;
  readonly tableTestId: string;
  readonly virtualizedTestId?: string;
  readonly onClearFilters?: () => void;
};

export function ReviewsHubInventoryTable(props: ReviewsHubInventoryTableProps): React.JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtualization = shouldVirtualizeReviewsList(props.runs.length);

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? props.runs.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => REVIEWS_LIST_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  if (props.runs.length === 0) {
    return (
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="reviews-hub-inventory-empty"
        role="status"
      >
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          No reviews match the current search or filters.
        </p>
        {props.onClearFilters !== undefined ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto px-2 py-1 text-al-text-primary"
            onClick={props.onClearFilters}
            data-testid="reviews-hub-inventory-empty-clear"
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    );
  }

  if (useVirtualization) {
    return (
      <div
        ref={parentRef}
        className="max-h-[min(32rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
        data-testid={props.virtualizedTestId ?? `${props.tableTestId}-virtualized`}
      >
        <EnterpriseTable ariaLabel={props.ariaLabel} data-testid={props.tableTestId} className="border-0">
          <ReviewsHubInventoryTableHead />
          <EnterpriseTableBody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const run = props.runs[virtualRow.index];
              const rowStyle: CSSProperties = {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                display: "table",
                tableLayout: "fixed",
              };

              return (
                <ReviewsHubInventoryRow
                  key={run.runId}
                  run={run}
                  ownerContext={props.ownerContext}
                  siblingRuns={props.siblingRuns}
                  style={rowStyle}
                />
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <EnterpriseTable ariaLabel={props.ariaLabel} data-testid={props.tableTestId}>
        <ReviewsHubInventoryTableHead />
        <EnterpriseTableBody>
          {props.runs.map((run) => (
            <ReviewsHubInventoryRow
              key={run.runId}
              run={run}
              ownerContext={props.ownerContext}
              siblingRuns={props.siblingRuns}
            />
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
