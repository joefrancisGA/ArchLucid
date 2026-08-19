import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";

export type GovernanceOverviewBlockingFindingsBreakdown = {
  readonly unownedHighSeverityFindings: number;
  readonly staleFindings: number;
  readonly findingsAwaitingEvidence: number;
};

export type GovernanceOverviewSummaryMetrics = {
  readonly pendingApprovalRequests: number;
  readonly approvedReviewPackages: number;
  readonly blockingFindings: GovernanceOverviewBlockingFindingsBreakdown;
  readonly blockingFindingsTotal: number;
  readonly recentDecisions: number;
  readonly policyActivations: number;
};

export function buildGovernanceOverviewSummaryMetrics(
  dashboard: GovernanceDashboardSummary,
  decisionsNeeded: GovernanceDecisionsNeededSummary,
): GovernanceOverviewSummaryMetrics {
  const approvedReviewPackages = dashboard.recentDecisions.filter(
    (row) => row.status.trim().toLowerCase() === "approved",
  ).length;

  const blockingFindings: GovernanceOverviewBlockingFindingsBreakdown = {
    unownedHighSeverityFindings: decisionsNeeded.unownedHighSeverityRisks,
    staleFindings: decisionsNeeded.staleRisks,
    findingsAwaitingEvidence: decisionsNeeded.findingsAwaitingEvidence,
  };

  const blockingFindingsTotal =
    blockingFindings.unownedHighSeverityFindings +
    blockingFindings.staleFindings +
    blockingFindings.findingsAwaitingEvidence;

  return {
    pendingApprovalRequests: dashboard.pendingCount,
    approvedReviewPackages,
    blockingFindings,
    blockingFindingsTotal,
    recentDecisions: dashboard.recentDecisions.length,
    policyActivations: dashboard.recentChanges.length,
  };
}
