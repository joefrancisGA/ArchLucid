"use client";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import {
  runsDashboardDisabledTabReason,
  runsDashboardTabHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { cn } from "@/lib/utils";

export type RunsDashboardStatusTabLinksProps = {
  readonly buyerPolishedShell: boolean;
  readonly tab: RunsDashboardTabId;
  readonly statusTabIds: readonly RunsDashboardTabId[];
  readonly statusTabCounts: Readonly<Record<RunsDashboardTabId, number>> & {
    readonly recentTotalCount?: number;
  };
  readonly currentSearch: string;
  readonly testIdPrefix: string;
  readonly homePreviewMode?: boolean;
};

export function RunsDashboardStatusTabLinks(props: RunsDashboardStatusTabLinksProps): React.JSX.Element {
  return (
    <FilterChipGroup
      aria-label={props.buyerPolishedShell ? "Filter reviews" : "Review views"}
      data-testid="runs-dashboard-status-filters"
      className={cn(
        "flex flex-wrap gap-1.5",
        props.buyerPolishedShell ? "" : "-mb-px border-b border-neutral-200 pb-0 dark:border-neutral-800",
      )}
    >
      {props.statusTabIds.map((id) => {
        const selected = props.tab === id;
        const disabled = props.statusTabCounts[id] === 0 && id !== "all";
        const label = runsDashboardTabLabel(id, props.buyerPolishedShell, props.statusTabCounts[id], {
          homePreviewMode: props.homePreviewMode === true,
          recentTotalCount: props.statusTabCounts.recentTotalCount,
        });
        const disabledReasonId = `${props.testIdPrefix}-${id}-disabled-reason`;

        if (disabled) {
          return (
            <span key={id} className="inline-flex">
              <FilterChip
                className={buyerFilterChipClass(false, true)}
                aria-label={label}
                aria-describedby={disabledReasonId}
                disabled
                data-testid={`${props.testIdPrefix}-${id}`}
              >
                {label}
              </FilterChip>
              <span id={disabledReasonId} className="sr-only">
                {runsDashboardDisabledTabReason(id, props.buyerPolishedShell)}
              </span>
            </span>
          );
        }

        return (
          <FilterChip
            key={id}
            href={runsDashboardTabHrefFromSearch(props.currentSearch, id)}
            className={buyerFilterChipClass(selected, false)}
            aria-current={selected ? "page" : undefined}
            data-testid={`${props.testIdPrefix}-${id}`}
          >
            {label}
          </FilterChip>
        );
      })}
    </FilterChipGroup>
  );
}
