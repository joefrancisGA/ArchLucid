"use client";

import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import type { RunSummary } from "@/types/authority";

import {
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_PAGE_TITLE,
} from "./reviews-hub-copy";
import { toReviewsHubPackageRowDisplay } from "./reviews-hub-package-display";
import {
  REVIEWS_LIST_ROW_ESTIMATE_PX,
  shouldVirtualizeReviewsList,
} from "./reviews-list-virtualization";

type ReviewsHubRecentPackagesProps = {
  readonly runs: readonly RunSummary[];
};

type RecentPackageRowProps = {
  readonly run: RunSummary;
  readonly style?: CSSProperties;
};

function ReviewsHubRecentPackageRow(props: RecentPackageRowProps): React.JSX.Element {
  const row = toReviewsHubPackageRowDisplay(props.run);

  return (
    <EnterpriseTableRow
      data-testid={row.isSampleReview ? "reviews-hub-sample-row" : `reviews-hub-row-${row.runId}`}
      style={props.style}
    >
      <EnterpriseTableCell>
        <div className="min-w-[12rem]">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.reviewTitle}</p>
          {row.isSampleReview ? (
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Sample review</p>
          ) : null}
        </div>
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <RunStatusBadge run={props.run} />
        <span className="sr-only">{row.overallStatus}</span>
      </EnterpriseTableCell>
      <EnterpriseTableCell>{row.lastUpdated}</EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.findingsCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.riskCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.evidenceCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell>{row.governanceState}</EnterpriseTableCell>
      <EnterpriseTableCell>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={row.primaryAction.href} data-testid={`reviews-hub-primary-action-${row.runId}`}>
            {row.primaryAction.label}
          </Link>
        </Button>
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}

function ReviewsHubRecentPackagesTableHead(): React.JSX.Element {
  return (
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow>
        <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Last updated</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Findings</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Risks</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Evidence</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Governance</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}

/** Recent packages table or intentional empty state for `/architecture/reviews`. */
export function ReviewsHubRecentPackages(props: ReviewsHubRecentPackagesProps): React.JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtualization = shouldVirtualizeReviewsList(props.runs.length);

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? props.runs.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => REVIEWS_LIST_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  return (
    <section className="mt-8" data-testid="reviews-hub-recent-packages">
      {props.runs.length === 0 ? (
        <div
          className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-5 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="reviews-hub-recent-empty"
          role="status"
        >
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{REVIEWS_HUB_RECENT_EMPTY_TITLE}</p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEWS_HUB_RECENT_EMPTY_BODY}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/architecture/reviews/new" data-testid="reviews-hub-recent-empty-start-review">
                {REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL}
              </Link>
            </Button>
          </div>
        </div>
      ) : useVirtualization ? (
        <div
          ref={parentRef}
          className="max-h-[min(32rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
          data-testid="reviews-hub-packages-virtualized"
        >
          <EnterpriseTable ariaLabel={REVIEWS_HUB_PAGE_TITLE} data-testid="reviews-hub-packages-table" className="border-0">
            <ReviewsHubRecentPackagesTableHead />
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

                return <ReviewsHubRecentPackageRow key={run.runId} run={run} style={rowStyle} />;
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <EnterpriseTable ariaLabel={REVIEWS_HUB_PAGE_TITLE} data-testid="reviews-hub-packages-table">
            <ReviewsHubRecentPackagesTableHead />
            <EnterpriseTableBody>
              {props.runs.map((run) => (
                <ReviewsHubRecentPackageRow key={run.runId} run={run} />
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      )}
    </section>
  );
}
