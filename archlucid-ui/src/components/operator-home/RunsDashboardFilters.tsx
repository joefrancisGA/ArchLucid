"use client";

import { useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsHrefFromSearch,
  runsDashboardHomeHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";

export type RunsDashboardFiltersProps = {
  readonly buyerPolishedShell: boolean;
  readonly governanceWarningsOnly: boolean;
  readonly showArchived: boolean;
  readonly archivedFieldSupported: boolean;
  readonly archivedCount: number;
  readonly archivedFilterDisabled: boolean;
};

export function RunsDashboardFilters(props: RunsDashboardFiltersProps) {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  if (props.buyerPolishedShell) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1.5"
      data-testid="runs-dashboard-filters"
      role="group"
      aria-label="Filter reviews"
    >
      {props.governanceWarningsOnly ? (
        <FilterChip
          href={homeGovernanceWarningsClearHrefFromSearch(currentSearch)}
          className={buyerFilterChipClass(true, false)}
          aria-current={true}
          aria-label={RUNS_DASHBOARD_LABELS.governanceWarningsOnly}
          data-testid="runs-dashboard-governance-warnings-only"
        >
          {RUNS_DASHBOARD_LABELS.governanceWarningsOnly}
        </FilterChip>
      ) : (
        <FilterChip
          href={homeGovernanceWarningsHrefFromSearch(currentSearch)}
          className={buyerFilterChipClass(false, false)}
          aria-label={RUNS_DASHBOARD_LABELS.governanceWarningsOnly}
          data-testid="runs-dashboard-governance-warnings-only"
        >
          {RUNS_DASHBOARD_LABELS.governanceWarningsOnly}
        </FilterChip>
      )}
      {props.archivedFieldSupported ? (
        props.showArchived ? (
          <FilterChip
            href={runsDashboardHomeHrefFromSearch(currentSearch, { showArchived: false })}
            className={buyerFilterChipClass(true, props.archivedFilterDisabled)}
            aria-current={true}
            aria-label={RUNS_DASHBOARD_LABELS.showArchived}
            data-testid="runs-dashboard-show-archived"
          >
            {RUNS_DASHBOARD_LABELS.showArchived}
          </FilterChip>
        ) : (
          <FilterChip
            href={props.archivedFilterDisabled ? undefined : runsDashboardHomeHrefFromSearch(currentSearch, { showArchived: true })}
            className={buyerFilterChipClass(false, props.archivedFilterDisabled)}
            aria-label={RUNS_DASHBOARD_LABELS.showArchived}
            disabled={props.archivedFilterDisabled}
            data-testid="runs-dashboard-show-archived"
          >
            {RUNS_DASHBOARD_LABELS.showArchived}
          </FilterChip>
        )
      ) : null}
    </div>
  );
}
