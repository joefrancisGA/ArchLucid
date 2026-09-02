"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReviewFilterId } from "./reviews-hub-inventory-filters";
import { INVENTORY_FILTER_OPTIONS } from "./reviews-hub-inventory-filters";

export type ReviewsHubActiveFiltersStripProps = {
  readonly activeFilter: ReviewFilterId;
  readonly searchQuery: string;
  readonly onClearSearch: () => void;
  readonly onClearFilter: () => void;
};

function resolveActiveFilterLabel(filter: ReviewFilterId): string {
  if (filter === "all") {
    return "";
  }

  return INVENTORY_FILTER_OPTIONS.find((option) => option.id === filter)?.label ?? filter;
}

type ActiveFilterChipProps = {
  readonly label: string;
  readonly onDismiss: () => void;
  readonly testId: string;
  readonly dismissLabel: string;
};

function ActiveFilterChip(props: ActiveFilterChipProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid={props.testId}
    >
      <span>{props.label}</span>
      <button
        type="button"
        className="rounded px-1 text-al-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label={props.dismissLabel}
        onClick={props.onDismiss}
        data-testid={`${props.testId}-dismiss`}
      >
        ×
      </button>
    </span>
  );
}

/** Visible active-filter affordance when reviews hub inventory has filter and/or search applied. */
export function ReviewsHubActiveFiltersStrip(
  props: ReviewsHubActiveFiltersStripProps,
): React.JSX.Element | null {
  const trimmedSearch = props.searchQuery.trim();
  const filterActive = props.activeFilter !== "all";
  const searchActive = trimmedSearch.length > 0;

  if (!filterActive && !searchActive) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="reviews-hub-active-filters-strip"
      role="status"
    >
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Showing reviews matching</span>
      {filterActive ? (
        <ActiveFilterChip
          label={resolveActiveFilterLabel(props.activeFilter)}
          onDismiss={props.onClearFilter}
          testId="reviews-hub-active-filter-chip"
          dismissLabel={`Remove ${resolveActiveFilterLabel(props.activeFilter)} filter`}
        />
      ) : null}
      {searchActive ? (
        <ActiveFilterChip
          label={`"${trimmedSearch}"`}
          onDismiss={props.onClearSearch}
          testId="reviews-hub-active-search-chip"
          dismissLabel={`Remove search "${trimmedSearch}"`}
        />
      ) : null}
      {filterActive && searchActive ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-2 py-1 text-al-text-primary"
          onClick={() => {
            props.onClearSearch();
            props.onClearFilter();
          }}
          data-testid="reviews-hub-active-filters-clear"
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
