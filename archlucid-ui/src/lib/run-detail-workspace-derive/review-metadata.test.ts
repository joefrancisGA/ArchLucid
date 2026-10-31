import { describe, expect, it } from "vitest";

import { deriveLastEvaluatedLabel, formatReviewGovernanceDecisionRecordedByDisplay } from "./review-metadata";

describe("formatReviewGovernanceDecisionRecordedByDisplay", () => {
  it("replaces uuid approver ids with recorded-by honesty copy", () => {
    expect(
      formatReviewGovernanceDecisionRecordedByDisplay("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("Approver name was not stored. Recorded-by user id 550e8400-e29b-41d4-a716-446655440000.");
    expect(formatReviewGovernanceDecisionRecordedByDisplay("jordan.lee@example.com")).toBe(
      "jordan.lee@example.com",
    );
    expect(formatReviewGovernanceDecisionRecordedByDisplay(null)).toBeNull();
    expect(formatReviewGovernanceDecisionRecordedByDisplay("")).toBe(
      "Governance decision recorder was stored empty.",
    );
  });
});

describe("deriveLastEvaluatedLabel (P-01–P-03)", () => {
  it("does not fall back to run.createdUtc when completed and manifest times are absent", () => {
    const label = deriveLastEvaluatedLabel(
      {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-01-01T00:00:00.000Z",
      },
      null,
    );

    expect(label).toBeNull();
  });

  it("prefers completedUtc over manifest createdUtc", () => {
    const label = deriveLastEvaluatedLabel(
      {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-01-01T00:00:00.000Z",
        completedUtc: "2026-01-08T00:00:00.000Z",
      },
      { createdUtc: "2026-01-07T00:00:00.000Z" } as never,
    );

    expect(label).toBe("2026-01-08T00:00:00.000Z");
  });
});
