"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReviewFilterId } from "./reviews-hub-inventory-filters";
import { INVENTORY_FILTER_OPTIONS } from "./reviews-hub-inventory-filters";

export type ReviewsHubActiveFiltersStripProps = {
  readonly activeFilter: ReviewFilterId;
  readonly searchQuery: string;
  readonly onClear: () => void;
};

function resolveActiveFilterLabel(filter: ReviewFilterId): string {
  if (filter === "all") {
    return "";
  }

  return INVENTORY_FILTER_OPTIONS.find((option) => option.id === filter)?.label ?? filter;
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

  const parts: string[] = [];

  if (filterActive) {
    parts.push(resolveActiveFilterLabel(props.activeFilter));
  }

  if (searchActive) {
    parts.push(`"${trimmedSearch}"`);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="reviews-hub-active-filters-strip"
      role="status"
    >
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Showing reviews matching {parts.join(" and ")}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto px-2 py-1 text-al-text-primary"
        onClick={props.onClear}
        data-testid="reviews-hub-active-filters-clear"
      >
        Clear
      </Button>
    </div>
  );
}
