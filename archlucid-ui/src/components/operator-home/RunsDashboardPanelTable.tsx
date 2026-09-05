"use client";

import { RunsDashboardAttentionTab } from "@/components/operator-home/RunsDashboardAttentionTab";
import { RunsDashboardFilters } from "@/components/operator-home/RunsDashboardFilters";
import { RunsDashboardOutcomesTab } from "@/components/operator-home/RunsDashboardOutcomesTab";
import { RunsDashboardRecentTab } from "@/components/operator-home/RunsDashboardRecentTab";
import type { RunsDashboardLoadPhase } from "@/components/operator-home/runs-dashboard-load-phase";
import { TabsContent } from "@/components/ui/tabs";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES,
} from "@/lib/buyer/buyer-polish-copy";
import type { PrimaryReviewExploreLink } from "@/lib/buyer/buyer-safe-review-navigation";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import type { RunSummary } from "@/types/authority";

export type RunsDashboardPanelTableProps = {
  readonly buyerPolishedShell: boolean;
  readonly hideHeading: boolean;
  readonly phase: RunsDashboardLoadPhase;
  readonly showInitialLoadingSkeleton: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly runListError: boolean;
  readonly filteredItems: readonly RunSummary[];
  readonly displayItems: readonly RunSummary[];
  readonly approvedTabItems: readonly RunSummary[];
  readonly attentionTabItems: readonly RunSummary[];
  readonly monitoringTabItems: readonly RunSummary[];
  readonly homeAttentionPreviewItems: readonly RunSummary[];
  readonly homeAttentionPartitionLabel: string | undefined;
  readonly governanceWarningsOnly: boolean;
  readonly showArchived: boolean;
  readonly onGovernanceWarningsOnlyChange: (value: boolean) => void;
  readonly onShowArchivedChange: (value: boolean) => void;
  readonly allTabShowcase: RunSummary | undefined;
  readonly approvedTabShowcase: RunSummary | undefined;
  readonly attentionTabShowcase: RunSummary | undefined;
  readonly monitoringTabShowcase: RunSummary | undefined;
  readonly showcaseDemoRun: RunSummary | undefined;
  readonly showcasePrimaryCta: PrimaryReviewExploreLink | null;
  readonly buyerSafeHighlight: boolean;
  readonly archivedFieldSupported: boolean;
  readonly restoreBusyRequestId: string | null;
  readonly onRestoreArchivedRequest: (requestId: string) => void;
  readonly onClearGovernanceWarningsFilter: () => void;
};

export function RunsDashboardPanelTable({
  buyerPolishedShell,
  hideHeading,
  phase,
  showInitialLoadingSkeleton,
  failure,
  runListError,
  filteredItems,
  displayItems,
  approvedTabItems,
  attentionTabItems,
  monitoringTabItems,
  homeAttentionPreviewItems,
  homeAttentionPartitionLabel,
  governanceWarningsOnly,
  showArchived,
  onGovernanceWarningsOnlyChange,
  onShowArchivedChange,
  allTabShowcase,
  approvedTabShowcase,
  attentionTabShowcase,
  monitoringTabShowcase,
  showcaseDemoRun,
  showcasePrimaryCta,
  buyerSafeHighlight,
  archivedFieldSupported,
  restoreBusyRequestId,
  onRestoreArchivedRequest,
  onClearGovernanceWarningsFilter,
}: RunsDashboardPanelTableProps) {
  return (
    <>
      <RunsDashboardFilters
        buyerPolishedShell={buyerPolishedShell}
        governanceWarningsOnly={governanceWarningsOnly}
        governanceWarningsCount={displayItems.filter((run) => run.hasGovernanceWarnings === true).length}
        showArchived={showArchived}
        onGovernanceWarningsOnlyChange={onGovernanceWarningsOnlyChange}
        onShowArchivedChange={onShowArchivedChange}
      />

      <TabsContent value="all" className="pt-0" data-testid="runs-dashboard-panel-all">
        <RunsDashboardRecentTab
          phase={phase}
          showInitialLoadingSkeleton={showInitialLoadingSkeleton}
          failure={failure}
          runListError={runListError}
          filteredItems={filteredItems}
          effectiveItems={displayItems}
          buyerPolishedShell={buyerPolishedShell}
          showcaseDemoRun={allTabShowcase}
          showcasePrimaryCta={allTabShowcase !== undefined ? showcasePrimaryCta : null}
          buyerSafeHighlight={allTabShowcase !== undefined && buyerSafeHighlight}
          showArchived={showArchived}
          archivedFieldSupported={archivedFieldSupported}
          restoreBusyRequestId={restoreBusyRequestId}
          contentTestId="runs-dashboard-tab-all"
          governanceWarningsOnly={governanceWarningsOnly}
          onClearGovernanceWarningsFilter={onClearGovernanceWarningsFilter}
          onRestoreArchivedRequest={onRestoreArchivedRequest}
          pagePrimaryOwnedElsewhere={hideHeading}
        />
      </TabsContent>

      <TabsContent value="approved" className="pt-0" data-testid="runs-dashboard-panel-approved">
        <RunsDashboardRecentTab
          phase={phase}
          showInitialLoadingSkeleton={showInitialLoadingSkeleton}
          failure={failure}
          runListError={runListError}
          filteredItems={approvedTabItems}
          effectiveItems={displayItems}
          buyerPolishedShell={buyerPolishedShell}
          showcaseDemoRun={approvedTabShowcase}
          showcasePrimaryCta={approvedTabShowcase !== undefined ? showcasePrimaryCta : null}
          buyerSafeHighlight={approvedTabShowcase !== undefined && buyerSafeHighlight}
          showArchived={showArchived}
          archivedFieldSupported={archivedFieldSupported}
          restoreBusyRequestId={restoreBusyRequestId}
          contentTestId="runs-dashboard-tab-approved"
          statusFilterEmptyMessage={BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES}
          onRestoreArchivedRequest={onRestoreArchivedRequest}
          pagePrimaryOwnedElsewhere={hideHeading}
        />
      </TabsContent>

      <TabsContent value="attention" className="pt-0" data-testid="runs-dashboard-panel-attention">
        {buyerPolishedShell ? (
          <RunsDashboardRecentTab
            phase={phase}
            showInitialLoadingSkeleton={showInitialLoadingSkeleton}
            failure={failure}
            runListError={runListError}
            filteredItems={attentionTabItems}
            effectiveItems={displayItems}
            buyerPolishedShell={buyerPolishedShell}
            showcaseDemoRun={attentionTabShowcase}
            showcasePrimaryCta={attentionTabShowcase !== undefined ? showcasePrimaryCta : null}
            buyerSafeHighlight={attentionTabShowcase !== undefined && buyerSafeHighlight}
            showArchived={showArchived}
            archivedFieldSupported={archivedFieldSupported}
            restoreBusyRequestId={restoreBusyRequestId}
            contentTestId="runs-dashboard-tab-attention"
            statusFilterEmptyMessage={RUNS_DASHBOARD_LABELS.noReviewsNeedAttention}
            onRestoreArchivedRequest={onRestoreArchivedRequest}
            pagePrimaryOwnedElsewhere={hideHeading}
          />
        ) : (
          <RunsDashboardAttentionTab
            phase={phase}
            failure={failure}
            runListError={runListError}
            filteredItems={homeAttentionPreviewItems}
            attentionPartitionLabel={homeAttentionPartitionLabel}
            attentionPartitionId={hideHeading ? "unfinished-work" : undefined}
            totalAttentionCount={hideHeading ? attentionTabItems.length : undefined}
          />
        )}
      </TabsContent>

      <TabsContent value="outcomes" className="pt-0" data-testid="runs-dashboard-panel-outcomes">
        {buyerPolishedShell ? (
          <RunsDashboardRecentTab
            phase={phase}
            showInitialLoadingSkeleton={showInitialLoadingSkeleton}
            failure={failure}
            runListError={runListError}
            filteredItems={monitoringTabItems}
            effectiveItems={displayItems}
            buyerPolishedShell={buyerPolishedShell}
            showcaseDemoRun={monitoringTabShowcase}
            showcasePrimaryCta={monitoringTabShowcase !== undefined ? showcasePrimaryCta : null}
            buyerSafeHighlight={monitoringTabShowcase !== undefined && buyerSafeHighlight}
            showArchived={showArchived}
            archivedFieldSupported={archivedFieldSupported}
            restoreBusyRequestId={restoreBusyRequestId}
            contentTestId="runs-dashboard-tab-outcomes"
            statusFilterEmptyMessage={BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES}
            onRestoreArchivedRequest={onRestoreArchivedRequest}
            pagePrimaryOwnedElsewhere={hideHeading}
          />
        ) : (
          <RunsDashboardOutcomesTab buyerPolishedShell={buyerPolishedShell} showcaseDemoRun={showcaseDemoRun} />
        )}
      </TabsContent>
    </>
  );
}
