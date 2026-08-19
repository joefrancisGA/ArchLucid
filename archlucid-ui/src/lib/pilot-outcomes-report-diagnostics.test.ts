import { describe, expect, it } from "vitest";

import {
  buildPilotOutcomesEmptyDiagnostics,
  buildPilotOutcomesMostRecentFinalizedReviewHref,
} from "@/lib/pilot-outcomes-report-diagnostics";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

function buildReport(
  overrides: Partial<PilotValueReportJson> = {},
): PilotValueReportJson {
  return {
    tenantId: "tenant-1",
    fromUtc: "2026-03-01T00:00:00.000Z",
    toUtc: "2026-04-01T00:00:00.000Z",
    totalRunsCommitted: 0,
    runDetailsTruncated: false,
    runDetailCap: 50,
    totalFindings: 0,
    findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    totalRecommendationsProduced: 0,
    averagePipelineCompletionSeconds: null,
    governanceApprovals: 0,
    governanceRejections: 0,
    policyPackAssignments: 0,
    comparisonOrDriftDetections: 0,
    uniqueAgentTypes: [],
    committedRunsTimeline: [],
    governancePendingApprovalsNow: 0,
    auditExportTruncated: false,
    ...overrides,
  };
}

describe("pilot-outcomes-report-diagnostics", () => {
  it("resolves most recent finalized run id from timeline rows (TB-1967)", () => {
    const diagnostics = buildPilotOutcomesEmptyDiagnostics(
      buildReport({
        committedRunsTimeline: [
          {
            runId: "run-older",
            createdUtc: "2026-03-01T08:00:00.000Z",
            committedUtc: "2026-03-02T08:00:00.000Z",
            systemName: "Older",
          },
          {
            runId: "run-newest",
            createdUtc: "2026-03-10T08:00:00.000Z",
            committedUtc: "2026-03-11T08:00:00.000Z",
            systemName: "Newest",
          },
        ],
      }),
      "2026-03-01T00:00",
      "2026-04-01T00:00",
      false,
    );

    expect(diagnostics.mostRecentFinalizedRunId).toBe("run-newest");
    expect(diagnostics.mostRecentFinalizedUtc).toBe("2026-03-11T08:00:00.000Z");
    expect(buildPilotOutcomesMostRecentFinalizedReviewHref(diagnostics.mostRecentFinalizedRunId)).toBe(
      "/architecture/reviews/run-newest",
    );
  });

  it("returns null review href when run id is missing", () => {
    expect(buildPilotOutcomesMostRecentFinalizedReviewHref(null)).toBeNull();
    expect(buildPilotOutcomesMostRecentFinalizedReviewHref("   ")).toBeNull();
  });
});
