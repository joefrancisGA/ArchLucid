import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";

export type GovernanceOverviewSummaryMetrics = {
  readonly pendingApprovalRequests: number;
  readonly approvedReviewPackages: number;
  readonly blockingGovernanceAlerts: number;
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

  const blockingGovernanceAlerts =
    decisionsNeeded.unownedHighSeverityRisks + decisionsNeeded.staleRisks + decisionsNeeded.findingsAwaitingEvidence;

  return {
    pendingApprovalRequests: dashboard.pendingCount,
    approvedReviewPackages,
    blockingGovernanceAlerts,
    recentDecisions: dashboard.recentDecisions.length,
    policyActivations: dashboard.recentChanges.length,
  };
}
