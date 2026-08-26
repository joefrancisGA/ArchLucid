"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { FilterChip } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useArchivedReviewsClientCache } from "@/hooks/use-archived-reviews-client-cache";
import { useFavoriteReviews } from "@/hooks/use-favorite-reviews";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { resolveOperatorPrincipalOwnerLabel } from "@/lib/action-actor-display";
import { type ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";
import {
  buildReviewsHubWorkspaceScopeEmptyTeaching,
  shouldShowWorkspaceScopeEmptyTeaching,
} from "@/lib/workspace-scope-empty-teaching";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

import { ReviewsHubInventoryTable } from "./ReviewsHubInventoryTable";
import { ReviewsHubSummaryRow } from "./ReviewsHubSummaryRow";
import {
  REVIEWS_HUB_FILTER_MORE_LABEL,
  REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
  REVIEWS_HUB_SHOW_ARCHIVED_REVIEWS_LABEL,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import {
  emptyInventoryDescription,
  isArchivedRun,
  matchesFilter,
  matchesSearch,
  mergeRunsWithArchivedCache,
  MORE_FILTER_OPTIONS,
  PRIMARY_FILTER_OPTIONS,
  sortRunsForInventory,
  type ReviewFilterId,
} from "./reviews-hub-inventory-filters";
import type { ReviewsWorkspaceSummary } from "./reviews-workspace-summary";

type ReviewsHubReviewInventoryProps = {
  readonly runs: readonly RunSummary[];
  readonly summary: ReviewsWorkspaceSummary;
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
      currentUserLabel: resolveOperatorPrincipalOwnerLabel(currentPrincipal),
      draftRegistryEntries: draftEntries,
    }),
    [currentPrincipal, draftEntries],
  );
  const mergedRuns = useMemo(
    () => mergeRunsWithArchivedCache(props.runs, archivedRuns),
    [archivedRuns, props.runs],
  );
  const rows = useMemo(
    () => mergedRuns.map((run) => toReviewsHubReviewRowDisplay(run, ownerContext, mergedRuns)),
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
      (run) =>
        matchesSearch(run, searchQuery, ownerContext, mergedRuns) &&
        matchesFilter(run, activeFilter, ownerContext, mergedRuns),
    );
  }, [activeFilter, mergedRuns, ownerContext, searchQuery, visibilityFilteredRuns]);

  const sortedFilteredRuns = useMemo(
    () => sortRunsForInventory(filteredRuns, isFavorite),
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
    <section className="mt-4" data-testid="reviews-hub-recent-packages">
      {rows.length === 0 ? (
        <div className="space-y-4">
          <ReviewsHubSummaryRow summary={props.summary} />
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
        </div>
      ) : (
        <div className={OPERATOR_LAYOUT.sectionStack}>
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="reviews-hub-toolbar"
          >
            <div className="min-w-0 flex-1 basis-[14rem] sm:max-w-xs lg:max-w-sm">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER}
                aria-label={REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER}
                data-testid="reviews-hub-search"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" data-testid="reviews-hub-filters">
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
              <details
                className="m-0"
                data-testid="reviews-hub-more-filters"
                open={moreFilterSelected || showArchived}
              >
                <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {REVIEWS_HUB_FILTER_MORE_LABEL}
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={REVIEWS_HUB_FILTER_MORE_LABEL}>
                    {MORE_FILTER_OPTIONS.map((option) => (
                      <ReviewFilterChip
                        key={option.id}
                        option={option}
                        selected={activeFilter === option.id}
                        onSelect={setActiveFilter}
                      />
                    ))}
                  </div>
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
              </details>
            </div>
          </div>

          <ReviewsHubSummaryRow summary={props.summary} />

          <ReviewsHubInventoryTable
            runs={sortedFilteredRuns}
            siblingRuns={mergedRuns}
            ownerContext={ownerContext}
            ariaLabel={REVIEWS_HUB_PAGE_TITLE}
            tableTestId="reviews-hub-packages-table"
            virtualizedTestId="reviews-hub-packages-virtualized"
          />
        </div>
      )}
    </section>
  );
}
