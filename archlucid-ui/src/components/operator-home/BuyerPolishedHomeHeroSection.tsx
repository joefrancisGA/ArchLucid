"use client";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { PilotCommandCenterCardDeferred } from "@/app/(operator)/_sections/operator-home-page-view-deferred-chunks";
import { useLiveOperatorHomeRunsDashboard } from "@/hooks/use-live-operator-home-runs-dashboard";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import { deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns } from "@/lib/resolve-operator-home-workspace-phase";

type BuyerPolishedHomeHeroSectionProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
};

/** Buyer-polished home hero — single compact launchpad card above the fold. */
export function BuyerPolishedHomeHeroSection(props: BuyerPolishedHomeHeroSectionProps): React.JSX.Element {
  const runsDashboard = useLiveOperatorHomeRunsDashboard(props.runsDashboard);
  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    runsDashboard.items,
    runsDashboard.totalCount,
  );
  const overviewPhaseSignals = deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns(
    runsDashboard.items,
    runsDashboard.totalCount,
  );

  return (
    <section
      aria-label="Home command center"
      data-testid="operator-home-hero-section"
    >
      <PilotCommandCenterCardDeferred
        suppressLeadCopy
        showContextualHelp={false}
        runsDashboard={runsDashboard}
        hasWorkspaceReviews={workspaceMetrics.hasReviews}
        hasOverviewReviewRows={overviewPhaseSignals.hasOverviewReviewRows}
        openFindingsCount={workspaceMetrics.openFindings}
        governanceWarningsCount={workspaceMetrics.governanceWarnings}
      />
    </section>
  );
}
