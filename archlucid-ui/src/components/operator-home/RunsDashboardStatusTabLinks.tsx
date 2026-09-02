"use client";

import { useRef, type KeyboardEvent } from "react";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import {
  runsDashboardDisabledTabReason,
  runsDashboardTabHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { FilterChip } from "@/components/ui/filter-chip";
import { handleFilterChipGroupKeyDown } from "@/components/ui/filter-chip-group-keyboard";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { cn } from "@/lib/utils";

export type RunsDashboardStatusTabLinksProps = {
  readonly buyerPolishedShell: boolean;
  readonly tab: RunsDashboardTabId;
  readonly statusTabIds: readonly RunsDashboardTabId[];
  readonly statusTabCounts: Readonly<Record<RunsDashboardTabId, number>>;
  readonly currentSearch: string;
  readonly testIdPrefix: string;
};

export function RunsDashboardStatusTabLinks(props: RunsDashboardStatusTabLinksProps): React.JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);

  function onGroupKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (groupRef.current === null) {
      return;
    }

    handleFilterChipGroupKeyDown(event, groupRef.current);
  }

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={props.buyerPolishedShell ? "Filter reviews" : "Review views"}
      data-testid="runs-dashboard-status-filters"
      className={cn(
        "flex flex-wrap gap-1.5",
        props.buyerPolishedShell ? "" : "-mb-px overflow-x-auto border-b border-neutral-200 pb-0 dark:border-neutral-800",
      )}
      onKeyDown={onGroupKeyDown}
    >
      {props.statusTabIds.map((id) => {
        const selected = props.tab === id;
        const disabled = props.statusTabCounts[id] === 0 && id !== "all";
        const label = runsDashboardTabLabel(id, props.buyerPolishedShell, props.statusTabCounts[id]);
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
            scroll={false}
            className={buyerFilterChipClass(selected, false)}
            aria-current={selected ? "page" : undefined}
            data-testid={`${props.testIdPrefix}-${id}`}
          >
            {label}
          </FilterChip>
        );
      })}
    </div>
  );
}
