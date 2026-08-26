"use client";

import {
  ProvenanceViewModeSwitcher,
  type ProvenanceViewMode,
} from "@/components/provenance/ProvenanceViewModeSwitcher";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { PROVENANCE_PAGE_WORKSPACE_VIEW_MODE_OPTIONS } from "./provenance-page-workspace-presentation";

export type ProvenancePageWorkspaceFiltersProps = {
  readonly viewMode: ProvenanceViewMode;
  readonly onViewModeChange: (mode: ProvenanceViewMode) => void;
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
          <div className="flex flex-wrap gap-1.5" data-testid="provenance-graph-filters">
            {filterOptions.map((option) => {
              const active = activeFilters.has(option.id);
              const count = filterCounts.get(option.id) ?? 0;
              const zeroCount = count === 0;

              return (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="h-8"
                  aria-pressed={active}
                  aria-disabled={zeroCount}
                  tabIndex={zeroCount ? -1 : undefined}
                  onClick={() => onToggleFilter(option.id)}
                >
                  {option.label} ({count})
                </Button>
              );
            })}
          </div>
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
