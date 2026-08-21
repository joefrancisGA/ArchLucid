import { describe, expect, it } from "vitest";

import { buildPilotOutcomesSponsorNarrative } from "@/lib/pilot-outcomes-sponsor-report";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

function sampleReport(overrides: Partial<PilotValueReportJson> = {}): PilotValueReportJson {
  return {
    tenantId: "tenant-1",
    fromUtc: "2026-01-01T00:00:00.000Z",
    toUtc: "2026-02-01T00:00:00.000Z",
    totalRunsCommitted: 2,
    runDetailsTruncated: false,
    runDetailCap: 50,
    totalFindings: 5,
    findingsBySeverity: { critical: 1, high: 1, medium: 2, low: 1, info: 0 },
    totalRecommendationsProduced: 3,
    averagePipelineCompletionSeconds: 120,
    governanceApprovals: 2,
    governanceRejections: 0,
    policyPackAssignments: 1,
    comparisonOrDriftDetections: 0,
    uniqueAgentTypes: ["ArchitectureReviewer"],
    committedRunsTimeline: [],
    governancePendingApprovalsNow: 1,
    auditExportTruncated: false,
    ...overrides,
  };
}

describe("buildPilotOutcomesSponsorNarrative", () => {
  it("builds a deterministic narrative from report counts", () => {
    const narrative = buildPilotOutcomesSponsorNarrative(sampleReport());

    expect(narrative).toContain("finalized 2 architecture reviews");
    expect(narrative).toContain("identified 5 findings");
    expect(narrative).toContain("2 material (critical or high) findings");
    expect(narrative).toContain("2 approval decisions");
    expect(narrative).toContain("One item requires continuing monitoring");
  });

  it("uses singular phrasing for single counts", () => {
    const narrative = buildPilotOutcomesSponsorNarrative(
      sampleReport({
        totalRunsCommitted: 1,
        totalFindings: 1,
        findingsBySeverity: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
        governanceApprovals: 1,
        governanceRejections: 0,
        governancePendingApprovalsNow: 0,
      }),
    );

    expect(narrative).toContain("1 architecture review");
    expect(narrative).toContain("1 finding");
    expect(narrative).toContain("1 governance decision");
  });
});
