"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { FilterChip } from "@/components/ui/filter-chip";
import { Input } from "@/components/ui/input";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useArchivedReviewsClientCache } from "@/hooks/use-archived-reviews-client-cache";
import { useFavoriteReviews } from "@/hooks/use-favorite-reviews";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS, OPERATOR_LAYOUT } from "@/lib/design-tokens";
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

import { ReviewsHubInventoryTable } from "./ReviewsHubInventoryTable";
import { ReviewsHubSummaryRow } from "./ReviewsHubSummaryRow";
import {
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
} from "./reviews-hub-copy";
import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";
import {
  emptyInventoryDescription,
  isArchivedRun,
  matchesFilter,
  matchesSearch,
  mergeRunsWithArchivedCache,
  parseReviewsHubInventoryFilter,
  parseReviewsHubInventorySearchQuery,
  reviewsHubInventoryHrefFromSearch,
  reviewsHubInventorySearchHrefFromSearch,
  countRunsMatchingInventoryFilter,
  INVENTORY_FILTER_OPTIONS,
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
  readonly count: number;
  readonly onSelect: (id: ReviewFilterId) => void;
}): React.JSX.Element {
  return (
    <FilterChip
      className={buyerFilterChipClass(props.selected, false)}
      aria-pressed={props.selected}
      aria-label={`Filter reviews: ${props.option.label}${props.count > 0 ? ` (${props.count})` : ""}`}
      onClick={() => props.onSelect(props.option.id)}
    >
      <span>{props.option.label}</span>
      {props.count > 0 ? (
        <span
          className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          aria-hidden
        >
          {props.count}
        </span>
      ) : null}
    </FilterChip>
  );
}

/** Filterable review inventory for `/architecture/reviews`. */
export function ReviewsHubReviewInventory(props: ReviewsHubReviewInventoryProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(() =>
    parseReviewsHubInventorySearchQuery(searchParams.get("q")),
  );
  const urlFilter = parseReviewsHubInventoryFilter(searchParams.get("filter"));
  const urlSearchQuery = parseReviewsHubInventorySearchQuery(searchParams.get("q"));
  const [activeFilter, setActiveFilter] = useState<ReviewFilterId>(urlFilter);

  useEffect(() => {
    setActiveFilter(urlFilter);
  }, [urlFilter]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = reviewsHubInventorySearchHrefFromSearch(searchParams.toString(), searchQuery);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [router, searchParams, searchQuery]);

  const selectInventoryFilter = useCallback(
    (filter: ReviewFilterId) => {
      setActiveFilter(filter);
      router.replace(reviewsHubInventoryHrefFromSearch(searchParams.toString(), filter), { scroll: false });
    },
    [router, searchParams],
  );

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

  const visibilityFilteredRuns = useMemo(() => {
    if (activeFilter === "Archived") {
      return mergedRuns;
    }

    return mergedRuns.filter((run) => !isArchivedRun(run));
  }, [activeFilter, mergedRuns]);

  const filterCounts = useMemo(() => {
    const counts = new Map<ReviewFilterId, number>();

    for (const option of INVENTORY_FILTER_OPTIONS) {
      counts.set(
        option.id,
        countRunsMatchingInventoryFilter(visibilityFilteredRuns, option.id, ownerContext, mergedRuns),
      );
    }

    return counts;
  }, [mergedRuns, ownerContext, visibilityFilteredRuns]);

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
    <section data-testid="reviews-hub-recent-packages">
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
                className={OPERATOR_INVENTORY_TOOLBAR_SEARCH_CLASS}
                data-testid="reviews-hub-search"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" data-testid="reviews-hub-filters">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reviews">
                {INVENTORY_FILTER_OPTIONS.map((option) => (
                  <ReviewFilterChip
                    key={option.id}
                    option={option}
                    selected={activeFilter === option.id}
                    count={filterCounts.get(option.id) ?? 0}
                    onSelect={selectInventoryFilter}
                  />
                ))}
              </div>
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
