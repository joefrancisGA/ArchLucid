"use client";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { PilotCommandCenterCardDeferred } from "@/app/(operator)/_sections/operator-home-page-view-deferred-chunks";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator-home-workspace-metrics";

type BuyerPolishedHomeHeroSectionProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
};

/** Buyer-polished home hero — single compact launchpad card above the fold. */
export function BuyerPolishedHomeHeroSection(props: BuyerPolishedHomeHeroSectionProps): React.JSX.Element {
  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    props.runsDashboard.items,
    props.runsDashboard.totalCount,
  );

  return (
    <section
      aria-label="Overview command center"
      data-testid="operator-home-hero-section"
    >
      <PilotCommandCenterCardDeferred
        suppressLeadCopy
        showContextualHelp={false}
        runsDashboard={props.runsDashboard}
        hasWorkspaceReviews={workspaceMetrics.hasReviews}
        openFindingsCount={workspaceMetrics.openFindings}
        governanceWarningsCount={workspaceMetrics.governanceWarnings}
      />
    </section>
  );
}
