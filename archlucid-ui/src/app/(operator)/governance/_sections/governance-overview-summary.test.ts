import { describe, expect, it } from "vitest";

import { buildGovernanceOverviewSummaryMetrics } from "@/app/(operator)/governance/_sections/governance-overview-summary";
import type { GovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";

const decisionsNeeded: GovernanceDecisionsNeededSummary = {
  pendingApprovals: 2,
  staleRisks: 1,
  unownedHighSeverityRisks: 3,
  findingsAwaitingEvidence: 1,
  waiversExpiringWithin14Days: 0,
  deferredFindingsDue: 0,
  totalDecisionItems: 7,
};

const dashboard: GovernanceDashboardSummary = {
  pendingCount: 2,
  pendingApprovals: [],
  recentDecisions: [
    {
      approvalRequestId: "a1",
      runId: "run-1",
      manifestVersion: "1.0.0",
      status: "Approved",
      sourceEnvironment: "dev",
      targetEnvironment: "prod",
      requestedBy: "owner",
      requestedUtc: "2026-01-01T00:00:00Z",
    },
    {
      approvalRequestId: "a2",
      runId: "run-2",
      manifestVersion: "2.0.0",
      status: "Pending",
      sourceEnvironment: "dev",
      targetEnvironment: "prod",
      requestedBy: "owner",
      requestedUtc: "2026-01-02T00:00:00Z",
    },
  ],
  recentChanges: [{ changeLogId: "c1" } as GovernanceDashboardSummary["recentChanges"][number]],
};

describe("buildGovernanceOverviewSummaryMetrics", () => {
  it("aggregates dashboard and decisions-needed counts with decomposable blocking findings", () => {
    const metrics = buildGovernanceOverviewSummaryMetrics(dashboard, decisionsNeeded);

    expect(metrics.pendingApprovalRequests).toBe(2);
    expect(metrics.approvedReviewPackages).toBe(1);
    expect(metrics.blockingFindingsTotal).toBe(5);
    expect(metrics.blockingFindings).toEqual({
      unownedHighSeverityFindings: 3,
      staleFindings: 1,
      findingsAwaitingEvidence: 1,
    });
    expect(metrics.recentDecisions).toBe(2);
    expect(metrics.policyActivations).toBe(1);
  });
});
