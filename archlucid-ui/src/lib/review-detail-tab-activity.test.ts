import { describe, expect, it } from "vitest";

import { deriveReviewDetailTabActivityAt } from "@/lib/review-detail-tab-activity";

describe("review-detail-tab-activity (P-01–P-03)", () => {
  it("falls back review-package activity to completedUtc when manifest created time is missing", () => {
    const activity = deriveReviewDetailTabActivityAt({
      run: {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-08-01T00:00:00.000Z",
        completedUtc: "2026-08-08T00:00:00.000Z",
      },
      manifestSummary: { createdUtc: "" },
      manifestId: "manifest-1",
      findings: [],
      operatorGovernanceDecisionUtc: null,
    });

    expect(activity["review-package"]).toBe("2026-08-08T00:00:00.000Z");
    expect(activity.architecture).toBe("2026-08-08T00:00:00.000Z");
    expect(activity.architecture).not.toBe("2026-08-01T00:00:00.000Z");
  });

  it("falls back review-package activity when manifest created time is missing (P-05)", () => {
    const activity = deriveReviewDetailTabActivityAt({
      run: {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-08-01T00:00:00.000Z",
        completedUtc: "2026-08-08T00:00:00.000Z",
      },
      manifestSummary: { createdUtc: "" },
      manifestId: "manifest-1",
      findings: [],
      operatorGovernanceDecisionUtc: null,
    });

    expect(activity["review-package"]).toBe("2026-08-08T00:00:00.000Z");
  });
});
