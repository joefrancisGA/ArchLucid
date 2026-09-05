"use client";

import Link from "next/link";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
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
  readonly statusTabCounts: Readonly<Record<RunsDashboardTabId, number>> & {
    readonly recentTotalCount?: number;
  };
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

function renderReviewFilterChips(props: {
  readonly buyerPolishedShell: boolean;
  readonly hideHeading: boolean;
  readonly tab: RunsDashboardTabId;
  readonly statusTabIds: readonly RunsDashboardTabId[];
  readonly statusTabCounts: RunsDashboardPanelFiltersProps["statusTabCounts"];
  readonly onSelectDashboardTab: RunsDashboardPanelFiltersProps["onSelectDashboardTab"];
  readonly testIdPrefix: string;
}): React.JSX.Element {
  return (
    <FilterChipGroup
      aria-label={props.buyerPolishedShell ? "Filter reviews" : "Review views"}
      data-testid="runs-dashboard-status-filters"
      className="flex flex-wrap gap-1.5"
    >
      {props.statusTabIds.map((id) => {
        const selected = props.tab === id;
        const empty = props.statusTabCounts[id] === 0;
        const label = runsDashboardTabLabel(id, props.buyerPolishedShell, props.statusTabCounts[id], {
          homePreviewMode: props.hideHeading,
        });

        return (
          <FilterChip
            key={id}
            aria-pressed={selected}
            className={buyerFilterChipClass(selected, false, empty)}
            data-testid={`${props.testIdPrefix}-${id}`}
            onClick={() => {
              props.onSelectDashboardTab(id);
            }}
          >
            {label}
          </FilterChip>
        );
      })}
    </FilterChipGroup>
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
            {renderReviewFilterChips({
              buyerPolishedShell,
              hideHeading,
              tab,
              statusTabIds,
              statusTabCounts,
              onSelectDashboardTab,
              testIdPrefix: "runs-dashboard-filter",
            })}
            {archivedFieldSupported ? (
              <FilterChip
                data-testid="runs-dashboard-show-archived"
                className={buyerFilterChipClass(showArchived, archivedFilterDisabled, archivedCount === 0)}
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
          renderReviewFilterChips({
            buyerPolishedShell,
            hideHeading,
            tab,
            statusTabIds,
            statusTabCounts,
            onSelectDashboardTab,
            testIdPrefix: "runs-dashboard-tab",
          })
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
