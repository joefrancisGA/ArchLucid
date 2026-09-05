"use client";

import Link from "next/link";

import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import { runsDashboardTabLabel } from "@/components/operator-home/runs-dashboard-helpers";
import { runsDashboardDisabledTabReason } from "@/components/operator-home/runs-dashboard-panel-presentation";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
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

function resolveSelectedTabEmptyReason(props: {
  readonly buyerPolishedShell: boolean;
  readonly tab: RunsDashboardTabId;
  readonly statusTabCounts: RunsDashboardPanelFiltersProps["statusTabCounts"];
}): string | null {
  const count = props.statusTabCounts[props.tab] ?? 0;

  if (props.tab === "all" || count > 0) {
    return null;
  }

  return runsDashboardDisabledTabReason(props.tab, props.buyerPolishedShell);
}

function renderReviewViewLineTabs(props: {
  readonly buyerPolishedShell: boolean;
  readonly hideHeading: boolean;
  readonly tab: RunsDashboardTabId;
  readonly statusTabIds: readonly RunsDashboardTabId[];
  readonly statusTabCounts: RunsDashboardPanelFiltersProps["statusTabCounts"];
  readonly testIdPrefix: string;
}): React.JSX.Element {
  return (
    <TabsList
      aria-label={props.buyerPolishedShell ? "Filter reviews" : "Review views"}
      data-testid="runs-dashboard-status-filters"
      className="w-full justify-start"
    >
      {props.statusTabIds.map((id) => {
        const label = runsDashboardTabLabel(id, props.buyerPolishedShell, props.statusTabCounts[id], {
          homePreviewMode: props.hideHeading,
          recentTotalCount:
            id === "all" && props.hideHeading ? props.statusTabCounts.recentTotalCount : undefined,
        });

        return (
          <TabsTrigger
            key={id}
            value={id}
            data-testid={`${props.testIdPrefix}-${id}`}
          >
            {label}
          </TabsTrigger>
        );
      })}
    </TabsList>
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
  const selectedTabEmptyReason = resolveSelectedTabEmptyReason({
    buyerPolishedShell,
    tab,
    statusTabCounts,
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
            {renderReviewViewLineTabs({
              buyerPolishedShell,
              hideHeading,
              tab,
              statusTabIds,
              statusTabCounts,
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
          renderReviewViewLineTabs({
            buyerPolishedShell,
            hideHeading,
            tab,
            statusTabIds,
            statusTabCounts,
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
      {selectedTabEmptyReason !== null ? (
        <p
          className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
          data-testid="runs-dashboard-selected-tab-empty-reason"
        >
          {selectedTabEmptyReason}
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
