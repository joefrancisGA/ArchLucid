"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import {
  runsDashboardHomeHrefFromSearch,
  runsDashboardTabHrefFromSearch,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  BUYER_RUNS_DASHBOARD_OPEN_ALL_REVIEWS_CTA,
  BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY,
  BUYER_RUNS_DASHBOARD_RECENT_SUMMARY,
} from "@/lib/buyer/buyer-polish-copy";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type RunsDashboardPanelFiltersProps = {
  readonly buyerPolishedShell: boolean;
  readonly hideHeading: boolean;
  readonly tab: RunsDashboardTabId;
  readonly isRecentListTab: boolean;
  readonly statusTabIds: readonly RunsDashboardTabId[];
  readonly statusTabCounts: Readonly<Record<RunsDashboardTabId, number>>;
  readonly archivedFieldSupported: boolean;
  readonly archivedCount: number;
  readonly archivedFilterDisabled: boolean;
  readonly showArchived: boolean;
  readonly openAllReviewsHref: string;
};

function RunsDashboardStatusTabLinks(props: {
  readonly buyerPolishedShell: boolean;
  readonly tab: RunsDashboardTabId;
  readonly statusTabIds: readonly RunsDashboardTabId[];
  readonly statusTabCounts: Readonly<Record<RunsDashboardTabId, number>>;
  readonly currentSearch: string;
  readonly testIdPrefix: string;
}): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label={props.buyerPolishedShell ? "Filter reviews" : "Review views"}
      data-testid="runs-dashboard-status-filters"
      className={cn(
        "flex flex-wrap gap-1.5",
        props.buyerPolishedShell ? "" : "-mb-px overflow-x-auto border-b border-neutral-200 pb-0 dark:border-neutral-800",
      )}
    >
      {props.statusTabIds.map((id) => {
        const selected = props.tab === id;
        const disabled = props.statusTabCounts[id] === 0 && id !== "all";
        const label = runsDashboardTabLabel(id, props.buyerPolishedShell, props.statusTabCounts[id]);

        if (disabled) {
          return (
            <FilterChip
              key={id}
              className={buyerFilterChipClass(false, true)}
              aria-label={label}
              disabled
              data-testid={`${props.testIdPrefix}-${id}`}
            >
              {label}
            </FilterChip>
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
    </div>
  );
}

export function RunsDashboardPanelFilters({
  buyerPolishedShell,
  hideHeading,
  tab,
  isRecentListTab,
  statusTabIds,
  statusTabCounts,
  archivedFieldSupported,
  archivedCount,
  archivedFilterDisabled,
  showArchived,
  openAllReviewsHref,
}: RunsDashboardPanelFiltersProps) {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const archivedHref = runsDashboardHomeHrefFromSearch(currentSearch, { tab: "all", showArchived: true });

  return (
    <CardHeader className={OPERATOR_CARD.header}>
      {buyerPolishedShell && hideHeading ? null : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className={cn(OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
            {buyerPolishedShell
              ? BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY
              : isRecentListTab
                ? RUNS_DASHBOARD_LABELS.latestInWorkspace
                : null}
            {!buyerPolishedShell && tab === "attention" ? RUNS_DASHBOARD_LABELS.reviewsNeedingAttention : null}
            {!buyerPolishedShell && tab === "outcomes" ? RUNS_DASHBOARD_LABELS.reviewOutcomes : null}
          </CardTitle>
          {!buyerPolishedShell ? (
            <Link
              href={openAllReviewsHref}
              className={cn("inline-block shrink-0 font-semibold sm:ml-auto", OPERATOR_LINK.nav)}
              data-testid="runs-dashboard-open-all-reviews"
            >
              {RUNS_DASHBOARD_LABELS.openFullReviewsList}
            </Link>
          ) : null}
        </div>
      )}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          buyerPolishedShell && !hideHeading ? "justify-between" : OPERATOR_LAYOUT.inlineGap,
        )}
      >
        <RunsDashboardStatusTabLinks
          buyerPolishedShell={buyerPolishedShell}
          tab={tab}
          statusTabIds={statusTabIds}
          statusTabCounts={statusTabCounts}
          currentSearch={currentSearch}
          testIdPrefix={buyerPolishedShell ? "runs-dashboard-filter" : "runs-dashboard-tab"}
        />
        {buyerPolishedShell && archivedFieldSupported ? (
          showArchived ? (
            <FilterChip
              href={runsDashboardHomeHrefFromSearch(currentSearch, { tab: "all", showArchived: false })}
              className={buyerFilterChipClass(true, archivedFilterDisabled)}
              aria-current="true"
              aria-label={`Filter reviews: Archived ${archivedCount}`}
              data-testid="runs-dashboard-show-archived"
            >
              Archived {archivedCount}
            </FilterChip>
          ) : (
            <FilterChip
              href={archivedHref}
              className={buyerFilterChipClass(false, archivedFilterDisabled)}
              aria-label={`Filter reviews: Archived ${archivedCount}`}
              disabled={archivedFilterDisabled}
              data-testid="runs-dashboard-show-archived"
            >
              Archived {archivedCount}
            </FilterChip>
          )
        ) : null}
        {buyerPolishedShell && !hideHeading ? (
          <Link
            href={openAllReviewsHref}
            className={cn("inline-block shrink-0 font-semibold", OPERATOR_LINK.nav)}
            data-testid="runs-dashboard-open-all-reviews"
          >
            {BUYER_RUNS_DASHBOARD_OPEN_ALL_REVIEWS_CTA}
          </Link>
        ) : null}
      </div>
      {buyerPolishedShell && hideHeading ? null : (
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
          {isRecentListTab
            ? buyerPolishedShell
              ? BUYER_RUNS_DASHBOARD_RECENT_SUMMARY
              : RUNS_DASHBOARD_LABELS.recentSummary
            : null}
          {!isRecentListTab && tab === "attention"
            ? buyerPolishedShell
              ? RUNS_DASHBOARD_LABELS.attentionSummaryBuyer
              : RUNS_DASHBOARD_LABELS.attentionSummary
            : null}
          {!isRecentListTab && tab === "outcomes"
            ? "Reviews finalized, findings surfaced, and average time to finalization."
            : null}
        </p>
      )}
    </CardHeader>
  );
}
