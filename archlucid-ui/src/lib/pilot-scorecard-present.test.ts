import { describe, expect, it } from "vitest";

import {
  REVIEW_SCORECARD_PAGE_SUBTITLE,
  buildReviewScorecardMethodologyLines,
  buildReviewScorecardMetricsAsOfLabel,
  buildReviewScorecardOperationalMetrics,
  buildReviewScorecardScopeCue,
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

  it("builds sponsor report copy without implementation jargon", () => {
    expect(REVIEW_SCORECARD_PAGE_SUBTITLE).not.toMatch(/ROI_MODEL|GET|null/i);
    expect(REVIEW_SCORECARD_PAGE_SUBTITLE).toMatch(/at a glance/i);

    const summary = buildReviewScorecardSummaryRow(baseScorecard, null);

    expect(summary.estimatedReviewTimeSavingsReady).toBe(false);
    expect(summary.estimatedReviewTimeSavingsDetail).toContain("Configure ROI assumptions");
  });

  it("formats sub-minute cycle time as less than one minute with sample size", () => {
    const metrics = buildReviewScorecardOperationalMetrics({
      ...baseScorecard,
      averageTimeToManifestMinutes: 0.4,
      totalManifestsCreated: 3,
    });
    const cycleTime = metrics.find((metric) => metric.key === "averageTimeToManifestMinutes");

    expect(cycleTime?.value).toBe("< 1 min");
    expect(cycleTime?.detail).toBe("Mean across 3 finalized packages.");
    expect(cycleTime?.value).not.toContain("0 min");
  });

  it("distinguishes measured zero from unavailable counts", () => {
    const metrics = buildReviewScorecardOperationalMetrics({
      ...baseScorecard,
      totalRunsCommitted: 2,
      totalFindingsResolved: 0,
      totalAuditEventsGenerated: 0,
    });
    const committed = metrics.find((metric) => metric.key === "totalRunsCommitted");
    const affirmed = metrics.find((metric) => metric.key === "totalFindingsResolved");
    const audit = metrics.find((metric) => metric.key === "totalAuditEventsGenerated");

    expect(committed?.metricState).toBe("measured");
    expect(affirmed?.metricState).toBe("measuredZero");
    expect(affirmed?.value).toBe("0");
    expect(audit?.metricState).toBe("measuredZero");

    const emptyWorkspace = buildReviewScorecardOperationalMetrics({
      ...baseScorecard,
      totalRunsCommitted: 0,
      totalManifestsCreated: 0,
      totalFindingsResolved: 0,
      totalAuditEventsGenerated: 0,
      firstCommitUtc: null,
      daysSinceFirstCommit: null,
    });
    const emptyCommitted = emptyWorkspace.find((metric) => metric.key === "totalRunsCommitted");

    expect(emptyCommitted?.metricState).toBe("unavailable");
    expect(emptyCommitted?.value).toBe(" — ");
    expect(emptyCommitted?.detail).toContain("Start an architecture review");
  });

  it("uses complementary operational metrics with deep links", () => {
    const metrics = buildReviewScorecardOperationalMetrics({
      ...baseScorecard,
      totalRunsCommitted: 0,
      totalManifestsCreated: 0,
      firstCommitUtc: null,
      daysSinceFirstCommit: null,
    });

    expect(metrics.map((metric) => metric.title)).toEqual([
      "Committed reviews",
      "Affirmed findings",
      "Average review cycle time",
      "Audit events recorded",
    ]);
    expect(metrics[0]?.href).toBe("/architecture/reviews/new");
    expect(metrics[0]?.drillDownLabel).toBe("Start architecture review");
    expect(metrics[1]?.href).toBe("/governance/findings");
  });

  it("builds scope cue without commit wording and metrics as-of label", () => {
    expect(buildReviewScorecardScopeCue(baseScorecard)).toMatch(/review activity/i);
    expect(buildReviewScorecardScopeCue(baseScorecard)).not.toMatch(/commit/i);

    const asOf = buildReviewScorecardMetricsAsOfLabel("2026-01-15T12:00:00.000Z");

    expect(asOf).toMatch(/^Metrics as of /);
    expect(asOf).toContain("UTC");
  });

  it("keeps methodology lines sponsor-safe without raw metricSources keys", () => {
    const lines = buildReviewScorecardMethodologyLines({
      tenantId: "measured",
      roiEstimate: "unavailable",
      totalRunsCommitted: "measured",
    });

    expect(lines.join(" ")).not.toMatch(/tenantId|roiEstimate/i);
    expect(lines.some((line) => /finalized packages/i.test(line))).toBe(true);
  });
});
