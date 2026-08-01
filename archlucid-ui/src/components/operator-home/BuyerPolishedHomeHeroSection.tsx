import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator-home-workspace-metrics";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

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
      <PilotCommandCenterCard
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
