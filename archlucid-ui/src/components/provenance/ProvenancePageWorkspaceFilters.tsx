"use client";

import {
  ProvenanceViewModeSwitcher,
  type ProvenanceViewMode,
} from "@/components/provenance/ProvenanceViewModeSwitcher";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { provenanceCategoryHrefFromSearch } from "@/lib/provenance/provenance-workspace-filters-url";
import type { ProvenanceNodeFilterCategory } from "@/lib/provenance-node-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { PROVENANCE_PAGE_WORKSPACE_VIEW_MODE_OPTIONS } from "./provenance-page-workspace-presentation";

export type ProvenancePageWorkspaceFiltersProps = {
  readonly viewMode: ProvenanceViewMode;
  readonly onViewModeChange: (mode: ProvenanceViewMode) => void;
  readonly pathname: string;
  readonly currentSearch: string;
  readonly filterOptions: ReadonlyArray<{ id: string; label: string }>;
  readonly activeFilters: ReadonlySet<string>;
  readonly filterCounts: ReadonlyMap<string, number>;
  readonly onToggleFilter: (filterId: string) => void;
  readonly graphVisibleNodeCount: number;
  readonly totalNodeCount: number;
};

export function ProvenancePageWorkspaceFilters({
  viewMode,
  onViewModeChange,
  pathname,
  currentSearch,
  filterOptions,
  activeFilters,
  filterCounts,
  onToggleFilter,
  graphVisibleNodeCount,
  totalNodeCount,
}: ProvenancePageWorkspaceFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ProvenanceViewModeSwitcher
          options={PROVENANCE_PAGE_WORKSPACE_VIEW_MODE_OPTIONS}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />

        {viewMode === "graph" ? (
          <FilterChipGroup aria-label="Provenance graph category filters" className="flex flex-wrap gap-1.5" data-testid="provenance-graph-filters">
            {filterOptions
              .filter((option) => (filterCounts.get(option.id) ?? 0) > 0)
              .map((option) => {
              const active = activeFilters.has(option.id);
              const count = filterCounts.get(option.id) ?? 0;
              const zeroCount = count === 0;
              const category = option.id as ProvenanceNodeFilterCategory;

              return (
                <FilterChip
                  key={option.id}
                  href={provenanceCategoryHrefFromSearch(
                    currentSearch,
                    active ? null : category,
                    pathname,
                  )}
                  scroll={false}
                  className={buyerFilterChipClass(active, zeroCount)}
                  aria-pressed={active}
                  aria-disabled={zeroCount}
                  tabIndex={zeroCount ? -1 : undefined}
                  data-testid={`provenance-category-${option.id}`}
                  onClick={(event) => {
                    if (zeroCount) {
                      event.preventDefault();

                      return;
                    }

                    onToggleFilter(option.id);
                  }}
                >
                  {option.label} ({count})
                </FilterChip>
              );
            })}
          </FilterChipGroup>
        ) : null}
      </div>

      {viewMode === "graph" && activeFilters.size > 0 ? (
        <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.micro)} role="status">
          Filters hide graph elements for focus only  —  all provenance data remains available in the tables view.
          Showing {graphVisibleNodeCount} of {totalNodeCount} nodes in the graph.
        </p>
      ) : null}
    </>
  );
}
