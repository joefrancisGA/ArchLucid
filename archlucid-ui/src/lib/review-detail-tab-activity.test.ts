import { describe, expect, it } from "vitest";

import { resolveFindingActivityAtUtc } from "@/lib/findings/finding-activity-at-utc";
import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";

describe("finding-activity-at-utc", () => {
  it("reads disposition timestamps from finding wire JSON", () => {
    const activityAt = resolveFindingActivityAtUtc({
      wireJson: JSON.stringify({ occurredAtUtc: "2026-08-09T15:00:00.000Z" }),
      reasoningTrace: "",
    });

    expect(activityAt).toBe("2026-08-09T15:00:00.000Z");
  });
});

describe("review-detail-tab-activity", () => {
  it("maps governance decision time to the decisions tab", () => {
    const activity = deriveReviewDetailTabActivityAt({
      run: {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-08-01T00:00:00.000Z",
        completedUtc: "2026-08-08T00:00:00.000Z",
      },
      manifestSummary: null,
      manifestId: null,
      findings: [],
      operatorGovernanceDecisionUtc: "2026-08-09T09:00:00.000Z",
    });

    expect(activity["decisions-remediation"]).toBe("2026-08-09T09:00:00.000Z");
  });
});
