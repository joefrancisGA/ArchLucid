import { describe, expect, it } from "vitest";

import { buildAdvisoryScanSummary } from "@/lib/advisory-scan-summary";
import type { ImprovementPlan, RecommendationRecord } from "@/types/advisory";

function recommendation(overrides: Partial<RecommendationRecord> = {}): RecommendationRecord {
  return {
    recommendationId: "rec-1",
    tenantId: "tenant",
    workspaceId: "ws",
    projectId: "default",
    runId: "run-a",
    title: "Sample",
    category: "Resilience",
    rationale: "Evidence from findings",
    suggestedAction: "Add circuit breaker",
    urgency: "High",
    expectedImpact: "High operational risk",
    priorityScore: 90,
    status: "Proposed",
    createdUtc: "2026-01-01T00:00:00Z",
    lastUpdatedUtc: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("buildAdvisoryScanSummary", () => {
  it("aggregates disposition counts and baseline metadata", () => {
    const plan: ImprovementPlan = {
      runId: "run-a",
      comparedToRunId: "run-b",
      generatedUtc: "2026-03-01T12:00:00Z",
      summaryNotes: [],
      recommendations: [],
    };
    const rows = [
      recommendation({ status: "Accepted" }),
      recommendation({ recommendationId: "rec-2", status: "Deferred", urgency: "Low", expectedImpact: "Low" }),
      recommendation({ recommendationId: "rec-3", status: "Rejected", urgency: "Critical", expectedImpact: "Medium" }),
      recommendation({ recommendationId: "rec-4", status: "Implemented" }),
    ];

    const summary = buildAdvisoryScanSummary(rows, plan, "");

    expect(summary.recommendationsGenerated).toBe(4);
    expect(summary.highImpactCount).toBe(3);
    expect(summary.accepted).toBe(1);
    expect(summary.deferred).toBe(1);
    expect(summary.rejected).toBe(1);
    expect(summary.implemented).toBe(1);
    expect(summary.lastScanUtc).toBe("2026-03-01T12:00:00Z");
    expect(summary.comparedToRunId).toBe("run-b");
  });
});
