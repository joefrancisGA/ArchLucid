"use client";

import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { buyerFilterChipClass } from "@/lib/buyer-shell-home-present";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator-scope-storage";
import { reviewPackageOwnerLabel } from "@/lib/review-package-validation-picker";
import {
  buildReviewsHubWorkspaceScopeEmptyTeaching,
  shouldShowWorkspaceScopeEmptyTeaching,
} from "@/lib/workspace-scope-empty-teaching";
import type { RunSummary } from "@/types/authority";

import {
  REVIEWS_HUB_FILTER_FINALIZED_LABEL,
  REVIEWS_HUB_FILTER_MORE_LABEL,
  REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL,
  REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER,
  REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
  REVIEWS_HUB_PAGE_TITLE,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import { reviewsHubOverallStatusTagKind, type ReviewsHubOverallStatus } from "./reviews-hub-review-status";
import {
  REVIEWS_LIST_ROW_ESTIMATE_PX,
  shouldVirtualizeReviewsList,
} from "./reviews-list-virtualization";

type ReviewsHubReviewInventoryProps = {
  readonly runs: readonly RunSummary[];
};

function subscribeOperatorScopeRecord(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onStoreChange);
  };
}

function getServerOperatorScopeRecordSnapshot(): OperatorScopeRecord | null {
  return null;
}

type ReviewFilterId =
  | "all"
  | "needs-attention"
  | "updated-recently"
  | "finalized"
  | ReviewsHubOverallStatus;

const PRIMARY_FILTER_OPTIONS: ReadonlyArray<{ id: ReviewFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-attention", label: REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL },
  { id: "finalized", label: REVIEWS_HUB_FILTER_FINALIZED_LABEL },
  { id: "updated-recently", label: REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL },
];

const MORE_FILTER_OPTIONS: ReadonlyArray<{ id: ReviewFilterId; label: string }> = [
  { id: "Draft", label: "Draft" },
  { id: "Active", label: "Active" },
  { id: "Awaiting approval", label: "Awaiting approval" },
  { id: "Archived", label: "Archived" },
];

function matchesSearch(run: RunSummary, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const row = toReviewsHubReviewRowDisplay(run);
  const haystack = [
    row.reviewTitle,
    row.architectureName,
    row.ownerLabel,
    run.runId,
    run.displayName ?? "",
    run.description ?? "",
    run.projectId,
    run.requestId ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function matchesFilter(run: RunSummary, filter: ReviewFilterId): boolean {
  const row = toReviewsHubReviewRowDisplay(run);

  if (filter === "all") {
    return true;
  }

  if (filter === "needs-attention") {
    return row.needsAttention;
  }

  if (filter === "finalized") {
    return row.overallStatus === "Finalized";
  }

  if (filter === "updated-recently") {
    const updatedAt = new Date(run.createdUtc).getTime();

    if (Number.isNaN(updatedAt)) {
      return false;
    }

    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    return Date.now() - updatedAt <= fourteenDaysMs;
  }

  return row.overallStatus === filter;
}

function ReviewFilterChip(props: {
  readonly option: { id: ReviewFilterId; label: string };
  readonly selected: boolean;
  readonly onSelect: (id: ReviewFilterId) => void;
}): React.JSX.Element {
  return (
    <FilterChip
      className={buyerFilterChipClass(props.selected, false)}
      aria-pressed={props.selected}
      aria-label={`Filter reviews: ${props.option.label}`}
      onClick={() => props.onSelect(props.option.id)}
    >
      {props.option.label}
    </FilterChip>
  );
}

function emptyInventoryDescription(draftCount: number): string {
  if (draftCount === 1) {
    return REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY;
  }

  if (draftCount > 1) {
    return REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY;
  }

  return REVIEWS_HUB_RECENT_EMPTY_BODY;
}

type InventoryRowProps = {
  readonly run: RunSummary;
  readonly style?: CSSProperties;
};

function ReviewsHubInventoryRow(props: InventoryRowProps): React.JSX.Element {
  const row = toReviewsHubReviewRowDisplay(props.run);

  return (
    <EnterpriseTableRow
      data-testid={row.isSampleReview ? "reviews-hub-sample-row" : `reviews-hub-row-${row.runId}`}
      style={props.style}
    >
      <EnterpriseTableCell>
        <div className="flex min-w-[12rem] items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={row.reviewHref}
              className={cn(OPERATOR_LINK.nav, "font-medium")}
              aria-label={`Open review ${row.reviewTitle}`}
              data-testid={`reviews-hub-primary-action-${row.runId}`}
            >
              {row.reviewTitle}
            </Link>
            {row.isSampleReview ? (
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Sample review
              </p>
            ) : null}
          </div>
          <FavoriteReviewToggle runId={row.runId} title={row.reviewTitle} />
        </div>
      </EnterpriseTableCell>
      <EnterpriseTableCell>{row.architectureName}</EnterpriseTableCell>
      <EnterpriseTableCell>
        <StatusTag
          kind={reviewsHubOverallStatusTagKind(row.overallStatus, row.needsAttention)}
          label={row.overallStatus}
        />
      </EnterpriseTableCell>
      <EnterpriseTableCell>{row.governanceState}</EnterpriseTableCell>
      <EnterpriseTableCell>{row.lifecycleStage}</EnterpriseTableCell>
      <EnterpriseTableCell>{reviewPackageOwnerLabel(props.run)}</EnterpriseTableCell>
      <EnterpriseTableCell title={props.run.createdUtc}>{row.lastUpdated}</EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.findingsCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.riskCount)}
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}

function ReviewsHubInventoryTableHead(): React.JSX.Element {
  return (
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow>
        <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Architecture / system</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Governance</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Last updated</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Findings</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Risks</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}

/** Filterable review inventory for `/architecture/reviews`. */
export function ReviewsHubReviewInventory(props: ReviewsHubReviewInventoryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReviewFilterId>("all");
  const draftEntries = useArchitectureDraftRegistryEntries();
  const rows = useMemo(() => props.runs.map(toReviewsHubReviewRowDisplay), [props.runs]);
  const draftCount = draftEntries.length;
  const hasDrafts = draftCount > 0;
  const moreFilterSelected = MORE_FILTER_OPTIONS.some((option) => option.id === activeFilter);
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredRuns = useMemo(() => {
    return props.runs.filter((run) => matchesSearch(run, searchQuery) && matchesFilter(run, activeFilter));
  }, [activeFilter, props.runs, searchQuery]);

  const useVirtualization = shouldVirtualizeReviewsList(filteredRuns.length);

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? filteredRuns.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => REVIEWS_LIST_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  const sampleHref = showcaseSampleReviewPackageHref();
  const scopeRecord = useSyncExternalStore(
    subscribeOperatorScopeRecord,
    readOperatorScopeFromStorage,
    getServerOperatorScopeRecordSnapshot,
  );
  const showWorkspaceScopeTeaching = shouldShowWorkspaceScopeEmptyTeaching({
    listEmpty: rows.length === 0,
    scopeRecord,
  });
  const workspaceScopeTeaching = showWorkspaceScopeTeaching
    ? buildReviewsHubWorkspaceScopeEmptyTeaching(scopeRecord)
    : null;

  return (
    <section className="mt-8" data-testid="reviews-hub-recent-packages">
      {rows.length === 0 ? (
        <div data-has-architecture-drafts={hasDrafts ? "true" : "false"}>
          {workspaceScopeTeaching !== null ? (
            <WorkspaceScopeEmptyTeaching
              title={workspaceScopeTeaching.title}
              body={workspaceScopeTeaching.body}
              ctaLabel={workspaceScopeTeaching.ctaLabel}
            />
          ) : (
            <EnterpriseCompactEmptyState
              testId="reviews-hub-recent-empty"
              title={hasDrafts ? REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE : REVIEWS_HUB_RECENT_EMPTY_TITLE}
              description={emptyInventoryDescription(draftCount)}
              actions={[
                {
                  label: REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
                  href: "/architecture/reviews/new",
                  variant: "primary",
                },
                {
                  label: REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
                  href: sampleHref,
                  variant: "outline",
                },
              ]}
            />
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-md">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER}
                aria-label={REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER}
                data-testid="reviews-hub-search"
              />
            </div>
            <div className="flex flex-col gap-2" data-testid="reviews-hub-filters">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reviews">
                {PRIMARY_FILTER_OPTIONS.map((option) => (
                  <ReviewFilterChip
                    key={option.id}
                    option={option}
                    selected={activeFilter === option.id}
                    onSelect={setActiveFilter}
                  />
                ))}
              </div>
              <details className="m-0" data-testid="reviews-hub-more-filters" open={moreFilterSelected}>
                <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {REVIEWS_HUB_FILTER_MORE_LABEL}
                </summary>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={REVIEWS_HUB_FILTER_MORE_LABEL}>
                  {MORE_FILTER_OPTIONS.map((option) => (
                    <ReviewFilterChip
                      key={option.id}
                      option={option}
                      selected={activeFilter === option.id}
                      onSelect={setActiveFilter}
                    />
                  ))}
                </div>
              </details>
            </div>
          </div>

          {useVirtualization ? (
            <div
              ref={parentRef}
              className="mt-3 max-h-[min(32rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
              data-testid="reviews-hub-packages-virtualized"
            >
              <EnterpriseTable
                ariaLabel={REVIEWS_HUB_PAGE_TITLE}
                data-testid="reviews-hub-packages-table"
                className="border-0"
              >
                <ReviewsHubInventoryTableHead />
                <EnterpriseTableBody
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const run = filteredRuns[virtualRow.index];
                    const rowStyle: CSSProperties = {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      display: "table",
                      tableLayout: "fixed",
                    };

                    return <ReviewsHubInventoryRow key={run.runId} run={run} style={rowStyle} />;
                  })}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <EnterpriseTable ariaLabel={REVIEWS_HUB_PAGE_TITLE} data-testid="reviews-hub-packages-table">
                <ReviewsHubInventoryTableHead />
                <EnterpriseTableBody>
                  {filteredRuns.map((run) => (
                    <ReviewsHubInventoryRow key={run.runId} run={run} />
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </div>
          )}

          {filteredRuns.length === 0 ? (
            <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
              No reviews match the current search or filters.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
