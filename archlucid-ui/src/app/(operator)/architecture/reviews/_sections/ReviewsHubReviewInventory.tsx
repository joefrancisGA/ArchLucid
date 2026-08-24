"use client";

import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import { ReviewArchiveControl } from "@/components/reviews/ReviewArchiveControl";
import { ReviewPinGlyph } from "@/components/reviews/ReviewPinGlyph";
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
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useArchivedReviewsClientCache } from "@/hooks/use-archived-reviews-client-cache";
import { useFavoriteReviews } from "@/hooks/use-favorite-reviews";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { type ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";
import {
  buildReviewsHubWorkspaceScopeEmptyTeaching,
  shouldShowWorkspaceScopeEmptyTeaching,
} from "@/lib/workspace-scope-empty-teaching";
import type { RunSummary } from "@/types/authority";

import {
  REVIEWS_HUB_ALL_REVIEWS_TITLE,
  REVIEWS_HUB_FILTER_FINALIZED_LABEL,
  REVIEWS_HUB_FILTER_MORE_LABEL,
  REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL,
  REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER,
  REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL,
  REVIEWS_HUB_PINNED_REVIEWS_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY,
  REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_SHOW_ARCHIVED_REVIEWS_LABEL,
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

const PINNED_COLUMN_CLASS = "w-10 px-2";

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

function matchesSearch(
  run: RunSummary,
  query: string,
  ownerContext: ReviewPackageOwnerResolutionContext,
): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized.length === 0) {
    return true;
  }

  const row = toReviewsHubReviewRowDisplay(run, ownerContext);
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

function matchesFilter(
  run: RunSummary,
  filter: ReviewFilterId,
  ownerContext: ReviewPackageOwnerResolutionContext,
): boolean {
  const row = toReviewsHubReviewRowDisplay(run, ownerContext);

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

function mergeRunsWithArchivedCache(
  runs: readonly RunSummary[],
  archivedRuns: readonly RunSummary[],
): RunSummary[] {
  const byId = new Map<string, RunSummary>();

  for (const run of runs) {
    byId.set(run.runId, run);
  }

  for (const archivedRun of archivedRuns) {
    if (!byId.has(archivedRun.runId)) {
      byId.set(archivedRun.runId, archivedRun);
    }
  }

  return [...byId.values()];
}

function isArchivedRun(run: RunSummary): boolean {
  return run.isArchived === true;
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
  readonly ownerContext: ReviewPackageOwnerResolutionContext;
  readonly style?: CSSProperties;
};

function ReviewsHubInventoryRow(props: InventoryRowProps): React.JSX.Element {
  const row = toReviewsHubReviewRowDisplay(props.run, props.ownerContext);

  return (
    <EnterpriseTableRow
      data-testid={row.isSampleReview ? "reviews-hub-sample-row" : `reviews-hub-row-${row.runId}`}
      style={props.style}
    >
      <EnterpriseTableCell className={PINNED_COLUMN_CLASS}>
        <FavoriteReviewToggle runId={row.runId} title={row.reviewTitle} />
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <div className="min-w-[12rem]">
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
      <EnterpriseTableCell>{row.ownerLabel}</EnterpriseTableCell>
      <EnterpriseTableCell title={props.run.createdUtc}>{row.lastUpdated}</EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.findingsCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right tabular-nums">
        {finiteIntegerCountDisplay(row.riskCount)}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <ReviewArchiveControl
          run={props.run}
          reviewTitle={row.reviewTitle}
          archivedRunSnapshot={props.run}
        />
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}

function ReviewsHubInventoryTableHead(): React.JSX.Element {
  return (
    <EnterpriseTableHead>
      <EnterpriseTableHeadRow>
        <EnterpriseTableHeaderCell className={PINNED_COLUMN_CLASS}>
          <span className="sr-only">Pinned</span>
          <ReviewPinGlyph filled={false} className="h-3.5 w-3.5 text-al-text-secondary" />
        </EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Architecture</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Approval</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Last updated</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Findings</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell className="text-right">Risks</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}

type ReviewsHubInventoryTableProps = {
  readonly runs: readonly RunSummary[];
  readonly ownerContext: ReviewPackageOwnerResolutionContext;
  readonly ariaLabel: string;
  readonly tableTestId: string;
  readonly virtualizedTestId?: string;
};

function ReviewsHubInventoryTable(props: ReviewsHubInventoryTableProps): React.JSX.Element {
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
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
        No reviews match the current search or filters.
      </p>
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
            <ReviewsHubInventoryRow key={run.runId} run={run} ownerContext={props.ownerContext} />
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}

/** Filterable review inventory for `/architecture/reviews`. */
export function ReviewsHubReviewInventory(props: ReviewsHubReviewInventoryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReviewFilterId>("all");
  const [showArchived, setShowArchived] = useState(false);
  const { isFavorite } = useFavoriteReviews();
  const { archivedRuns } = useArchivedReviewsClientCache();
  const draftEntries = useArchitectureDraftRegistryEntries();
  const { currentPrincipal } = useOperatorNavAuthority();
  const ownerContext = useMemo<ReviewPackageOwnerResolutionContext>(
    () => ({
      currentUserLabel: currentPrincipal.name,
      draftRegistryEntries: draftEntries,
    }),
    [currentPrincipal.name, draftEntries],
  );
  const mergedRuns = useMemo(
    () => mergeRunsWithArchivedCache(props.runs, archivedRuns),
    [archivedRuns, props.runs],
  );
  const rows = useMemo(
    () => mergedRuns.map((run) => toReviewsHubReviewRowDisplay(run, ownerContext)),
    [mergedRuns, ownerContext],
  );
  const draftCount = draftEntries.length;
  const hasDrafts = draftCount > 0;
  const moreFilterSelected = MORE_FILTER_OPTIONS.some((option) => option.id === activeFilter);
  const archivedCount = useMemo(
    () => mergedRuns.filter((run) => isArchivedRun(run)).length,
    [mergedRuns],
  );
  const showArchivedDisabled = archivedCount === 0;

  const visibilityFilteredRuns = useMemo(() => {
    if (showArchived) {
      return mergedRuns;
    }

    return mergedRuns.filter((run) => !isArchivedRun(run));
  }, [mergedRuns, showArchived]);

  const filteredRuns = useMemo(() => {
    return visibilityFilteredRuns.filter(
      (run) => matchesSearch(run, searchQuery, ownerContext) && matchesFilter(run, activeFilter, ownerContext),
    );
  }, [activeFilter, ownerContext, searchQuery, visibilityFilteredRuns]);

  const pinnedFilteredRuns = useMemo(
    () => filteredRuns.filter((run) => isFavorite(run.runId)),
    [filteredRuns, isFavorite],
  );

  const unpinnedFilteredRuns = useMemo(
    () => filteredRuns.filter((run) => !isFavorite(run.runId)),
    [filteredRuns, isFavorite],
  );

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
                  variant: "outline",
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
        <div className={OPERATOR_LAYOUT.sectionStack}>
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
              <div className="flex items-center gap-2">
                <input
                  id="reviews-hub-show-archived"
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-neutral-400 dark:border-neutral-600"
                  checked={showArchived}
                  disabled={showArchivedDisabled}
                  onChange={(event) => {
                    setShowArchived(event.target.checked);
                  }}
                  data-testid="reviews-hub-show-archived"
                />
                <Label
                  htmlFor="reviews-hub-show-archived"
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium")}
                >
                  {REVIEWS_HUB_SHOW_ARCHIVED_REVIEWS_LABEL}
                </Label>
              </div>
            </div>
          </div>

          {pinnedFilteredRuns.length > 0 ? (
            <div className={OPERATOR_LAYOUT.sectionStack} data-testid="reviews-hub-pinned-reviews">
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {REVIEWS_HUB_PINNED_REVIEWS_TITLE}
              </h2>
              <ReviewsHubInventoryTable
                runs={pinnedFilteredRuns}
                ownerContext={ownerContext}
                ariaLabel={REVIEWS_HUB_PINNED_REVIEWS_TITLE}
                tableTestId="reviews-hub-pinned-packages-table"
                virtualizedTestId="reviews-hub-pinned-packages-virtualized"
              />
            </div>
          ) : null}

          <div className={OPERATOR_LAYOUT.sectionStack}>
            {pinnedFilteredRuns.length > 0 ? (
              <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {REVIEWS_HUB_ALL_REVIEWS_TITLE}
              </h2>
            ) : null}
            <ReviewsHubInventoryTable
              runs={unpinnedFilteredRuns}
              ownerContext={ownerContext}
              ariaLabel={REVIEWS_HUB_PAGE_TITLE}
              tableTestId="reviews-hub-packages-table"
              virtualizedTestId="reviews-hub-packages-virtualized"
            />
          </div>
        </div>
      )}
    </section>
  );
}
