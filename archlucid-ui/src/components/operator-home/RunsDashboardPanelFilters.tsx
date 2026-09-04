"use client";

import Link from "next/link";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  readonly onSelectDashboardTab: (
    next: RunsDashboardTabId,
    options?: { readonly preserveShowArchived?: boolean },
  ) => void;
  readonly onShowArchivedChange: (value: boolean) => void;
  readonly openAllReviewsHref: string;
};

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
  onSelectDashboardTab,
  onShowArchivedChange,
  openAllReviewsHref,
}: RunsDashboardPanelFiltersProps) {
  const panelSummaryText = resolveRunsDashboardPanelSummaryText({
    buyerPolishedShell,
    hideHeading,
    isRecentListTab,
    tab,
  });

  return (
    <CardHeader className={OPERATOR_CARD.header}>
      {buyerPolishedShell && hideHeading ? null : hideHeading ? null : (
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
        {buyerPolishedShell ? (
          <>
            <TabsList
              aria-label="Filter reviews"
              data-testid="runs-dashboard-status-filters"
              className="flex flex-wrap gap-1.5"
            >
              {statusTabIds.map((id) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  data-testid={`runs-dashboard-filter-${id}`}
                  className="shrink-0"
                  disabled={statusTabCounts[id] === 0 && id !== "all"}
                >
                  {runsDashboardTabLabel(id, buyerPolishedShell, statusTabCounts[id])}
                </TabsTrigger>
              ))}
            </TabsList>
            {archivedFieldSupported ? (
              <FilterChip
                data-testid="runs-dashboard-show-archived"
                className={buyerFilterChipClass(showArchived, archivedFilterDisabled)}
                aria-pressed={showArchived}
                aria-label={`Filter reviews: Archived ${archivedCount}`}
                disabled={archivedFilterDisabled}
                onClick={() => {
                  if (archivedFilterDisabled) {
                    return;
                  }

                  const next = !showArchived;

                  if (next && tab !== "all") {
                    onSelectDashboardTab("all", { preserveShowArchived: true });
                  }

                  onShowArchivedChange(next);
                }}
              >
                Archived {archivedCount}
              </FilterChip>
            ) : null}
          </>
        ) : (
          <TabsList
            aria-label="Review views"
            data-testid="runs-dashboard-status-filters"
            className="-mb-px"
          >
            {statusTabIds.map((id) => (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`runs-dashboard-tab-${id}`}
                className="shrink-0"
              >
                {runsDashboardTabLabel(id, buyerPolishedShell, statusTabCounts[id])}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
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
      {panelSummaryText !== null ? (
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
          {panelSummaryText}
        </p>
      ) : null}
    </CardHeader>
  );
}

function resolveRunsDashboardPanelSummaryText(props: {
  readonly buyerPolishedShell: boolean;
  readonly hideHeading: boolean;
  readonly isRecentListTab: boolean;
  readonly tab: RunsDashboardTabId;
}): string | null {
  if (props.buyerPolishedShell && props.hideHeading) {
    return null;
  }

  if (props.isRecentListTab) {
    return props.buyerPolishedShell ? BUYER_RUNS_DASHBOARD_RECENT_SUMMARY : null;
  }

  if (props.tab === "attention") {
    return props.buyerPolishedShell
      ? RUNS_DASHBOARD_LABELS.attentionSummaryBuyer
      : RUNS_DASHBOARD_LABELS.attentionSummary;
  }

  if (props.tab === "outcomes") {
    return "Reviews finalized, findings surfaced, and average time to finalization.";
  }

  return null;
}
