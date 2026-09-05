"use client";

import { cn } from "@/lib/utils";

import { RunsDashboardPanelFilters } from "@/components/operator-home/RunsDashboardPanelFilters";
import { OperatorHomeRecentReviewsOutcomeLine } from "@/components/operator-home/OperatorHomeRecentReviewsOutcomeLine";
import { RunsDashboardGovernanceWarningsActiveFilter } from "@/components/operator-home/RunsDashboardGovernanceWarningsActiveFilter";
import { RunsDashboardPanelTable } from "@/components/operator-home/RunsDashboardPanelTable";
import { BUYER_RUNS_DASHBOARD_SECTION_HEADING } from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LAYOUT,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";

import type { RunsDashboardPanelViewModel } from "./use-runs-dashboard-panel";

export type RunsDashboardPanelChromeProps = {
  readonly model: RunsDashboardPanelViewModel;
};

export function RunsDashboardPanelChrome({ model }: RunsDashboardPanelChromeProps) {
  return (
    <section aria-labelledby="runs-dashboard-heading" data-onboarding="tour-runs-dashboard">
      {!model.hideHeading ? (
        <h3 id="runs-dashboard-heading" className={cn(OPERATOR_LAYOUT.sectionHeadingMargin, OPERATOR_HOME_SECTION_HEADING)}>
          {model.buyerPolishedShell ? BUYER_RUNS_DASHBOARD_SECTION_HEADING : RUNS_DASHBOARD_LABELS.sectionHeading}
        </h3>
      ) : null}
      {model.hideHeading && model.recentReviewsOutcomeMetrics !== null && model.recentReviewsOutcomeOptions !== null ? (
        <OperatorHomeRecentReviewsOutcomeLine
          metrics={model.recentReviewsOutcomeMetrics}
          openAllReviewsHref={model.openAllReviewsHref}
          options={model.recentReviewsOutcomeOptions}
        />
      ) : null}
      {model.governanceWarningsOnly ? (
        <RunsDashboardGovernanceWarningsActiveFilter
          visible={model.governanceWarningsOnly}
          onClear={model.clearGovernanceWarningsFilter}
        />
      ) : null}
      <Tabs
        value={model.tab}
        variant="line"
        onValueChange={(next) => {
          model.selectDashboardTab(next as RunsDashboardTabId);
        }}
      >
        <Card
          className={cn(
            model.showReviewFilters
              ? "border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              : "border-0 bg-transparent shadow-none",
          )}
          data-testid="runs-dashboard-panel"
        >
          {model.showReviewFilters ? (
            <RunsDashboardPanelFilters
              buyerPolishedShell={model.buyerPolishedShell}
              hideHeading={model.hideHeading}
              tab={model.tab}
              isRecentListTab={model.isRecentListTab}
              statusTabIds={model.statusTabIds}
              statusTabCounts={model.statusTabCounts}
              archivedFieldSupported={model.archivedFieldSupported}
              archivedCount={model.archivedCount}
              archivedFilterDisabled={model.archivedFilterDisabled}
              showArchived={model.showArchived}
              onSelectDashboardTab={model.selectDashboardTab}
              onShowArchivedChange={model.setShowArchived}
              openAllReviewsHref={model.openAllReviewsHref}
            />
          ) : null}
          <CardContent
            className={cn(
              model.showReviewFilters ? OPERATOR_CARD.content : "p-0",
              OPERATOR_LAYOUT.sectionStack,
              OPERATOR_TYPE_SCALE.body,
            )}
          >
            <RunsDashboardPanelTable
              buyerPolishedShell={model.buyerPolishedShell}
              hideHeading={model.hideHeading}
              phase={model.phase}
              showInitialLoadingSkeleton={model.showInitialLoadingSkeleton}
              failure={model.failure}
              runListError={model.runListError}
              filteredItems={model.filteredItems}
              displayItems={model.displayItems}
              approvedTabItems={model.approvedTabItems}
              attentionTabItems={model.attentionTabItems}
              monitoringTabItems={model.monitoringTabItems}
              homeAttentionPreviewItems={model.homeAttentionPreviewItems}
              homeAttentionPartitionLabel={model.homeAttentionPartitionLabel}
              governanceWarningsOnly={model.governanceWarningsOnly}
              showArchived={model.showArchived}
              onGovernanceWarningsOnlyChange={model.setGovernanceWarningsOnly}
              onShowArchivedChange={model.setShowArchived}
              allTabShowcase={model.allTabShowcase}
              approvedTabShowcase={model.approvedTabShowcase}
              attentionTabShowcase={model.attentionTabShowcase}
              monitoringTabShowcase={model.monitoringTabShowcase}
              showcaseDemoRun={model.showcaseDemoRun}
              showcasePrimaryCta={model.showcasePrimaryCta}
              buyerSafeHighlight={model.buyerSafeHighlight}
              archivedFieldSupported={model.archivedFieldSupported}
              restoreBusyRequestId={model.restoreBusyRequestId}
              onClearGovernanceWarningsFilter={model.clearGovernanceWarningsFilter}
              onRestoreArchivedRequest={(requestId) => {
                void model.restoreArchivedRequest(requestId);
              }}
            />
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}
