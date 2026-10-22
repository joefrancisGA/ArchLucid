import { describe, expect, it } from "vitest";

import { resolveAdvisoryScansTriageFirstPending } from "@/lib/advisory/resolve-advisory-scans-triage-first-pending";
import type { RecommendationRecord } from "@/types/advisory";

function recommendation(overrides: Partial<RecommendationRecord> = {}): RecommendationRecord {
  return {
    recommendationId: "rec-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    runId: "run-1",
    title: "Harden API gateway",
    category: "security",
    rationale: "rationale",
    suggestedAction: "action",
    urgency: "high",
    expectedImpact: "impact",
    priorityScore: 90,
    status: "Open",
    createdUtc: "2026-01-01T00:00:00Z",
    lastUpdatedUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveAdvisoryScansTriageFirstPending", () => {
  it("returns the oldest pending recommendation", () => {
    const match = resolveAdvisoryScansTriageFirstPending([
      recommendation({ recommendationId: "rec-new", createdUtc: "2026-02-01T00:00:00Z" }),
      recommendation({ recommendationId: "rec-old", createdUtc: "2025-01-01T00:00:00Z" }),
      recommendation({ recommendationId: "rec-done", status: "Implemented", createdUtc: "2024-01-01T00:00:00Z" }),
    ]);

    expect(match?.recommendationId).toBe("rec-old");
  });
});
