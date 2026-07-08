import { describe, expect, it } from "vitest";

import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  buildReviewScorecardOperationalMetrics,
  buildReviewScorecardSummaryRow,
  hasCommittedReviews,
} from "@/lib/pilot-scorecard-present";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

const baseScorecard: PilotScorecardJson = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  totalRunsCommitted: 3,
  totalManifestsCreated: 2,
  totalFindingsResolved: 5,
  averageTimeToManifestMinutes: 90,
  totalAuditEventsGenerated: 12,
  totalGovernanceApprovalsCompleted: 1,
  firstCommitUtc: "2026-01-01T00:00:00.000Z",
  daysSinceFirstCommit: 30,
  metricSources: {
    totalRunsCommitted: "measured",
    totalManifestsCreated: "measured",
  },
  baselines: null,
  roiEstimate: null,
};

describe("pilot-scorecard-present", () => {
  it("detects empty workspaces without committed reviews", () => {
    expect(hasCommittedReviews({ ...baseScorecard, totalRunsCommitted: 0 })).toBe(false);
    expect(hasCommittedReviews(baseScorecard)).toBe(true);
  });

  it("builds executive summary copy without implementation jargon", () => {
    expect(REVIEW_SCORECARD_PAGE_SUBTITLE).not.toMatch(/ROI_MODEL|GET|null/i);

    const summary = buildReviewScorecardSummaryRow(baseScorecard, null);

    expect(summary.estimatedReviewTimeSavingsDetail).toContain("ROI estimate available after baselines are saved");
  });

  it("uses executive-friendly operational metric labels and zero states", () => {
    const metrics = buildReviewScorecardOperationalMetrics({
      ...baseScorecard,
      totalRunsCommitted: 0,
      totalManifestsCreated: 0,
    });

    expect(metrics.map((metric) => metric.title)).toEqual([
      "Committed reviews",
      "Finalized packages",
      "Affirmed findings",
      "Average review cycle time",
      "Governance approvals completed",
      "Audit events recorded",
    ]);
    expect(metrics[0]?.detail).toBe("No committed reviews yet.");
    expect(metrics[1]?.detail).toBe("No finalized review packages yet.");
  });
});
