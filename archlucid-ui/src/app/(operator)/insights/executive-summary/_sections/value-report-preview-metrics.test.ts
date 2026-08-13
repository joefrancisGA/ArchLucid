import { describe, expect, it } from "vitest";

import type { PilotValueReportJson } from "@/types/pilot-value-report";

import {
  buildValueReportPreviewMetrics,
  valueReportHasData,
} from "./value-report-preview-metrics";

function sampleReport(overrides: Partial<PilotValueReportJson> = {}): PilotValueReportJson {
  return {
    tenantId: "tenant-1",
    fromUtc: "2026-01-01T00:00:00.000Z",
    toUtc: "2026-02-01T00:00:00.000Z",
    totalRunsCommitted: 3,
    runDetailsTruncated: false,
    runDetailCap: 50,
    totalFindings: 12,
    findingsBySeverity: {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
      info: 2,
    },
    totalRecommendationsProduced: 5,
    averagePipelineCompletionSeconds: 120,
    governanceApprovals: 4,
    governanceRejections: 1,
    policyPackAssignments: 2,
    comparisonOrDriftDetections: 1,
    uniqueAgentTypes: ["agent-a"],
    committedRunsTimeline: [],
    governancePendingApprovalsNow: 2,
    auditExportTruncated: false,
    ...overrides,
  };
}

describe("valueReportHasData", () => {
  it("returns false when preview is null", () => {
    expect(valueReportHasData(null)).toBe(false);
  });

  it("returns false when no committed reviews exist", () => {
    expect(valueReportHasData(sampleReport({ totalRunsCommitted: 0 }))).toBe(false);
  });

  it("returns true when committed reviews exist", () => {
    expect(valueReportHasData(sampleReport())).toBe(true);
  });
});

describe("buildValueReportPreviewMetrics", () => {
  it("maps pilot value report fields to preview metrics", () => {
    const metrics = buildValueReportPreviewMetrics(sampleReport());

    expect(metrics.reviewsIncluded).toBe(3);
    expect(metrics.findingsGenerated).toBe(12);
    expect(metrics.decisionsRecorded).toBe(5);
    expect(metrics.estimatedHoursSaved).toBe("17 h");
    expect(metrics.openGovernanceRisks).toBe(2);
  });
});
