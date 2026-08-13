import { describe, expect, it } from "vitest";

import { buildExecutiveScorecardRecommendedActions } from "./executive-scorecard-recommended-actions";

describe("buildExecutiveScorecardRecommendedActions", () => {
  it("prioritizes drift when change count is positive", () => {
    const actions = buildExecutiveScorecardRecommendedActions({
      complianceDriftChangeCount: 6,
      orphanCandidates: null,
      committedRunsTimeline: [],
    });

    expect(actions[0]?.id).toBe("compliance-drift");
    expect(actions[0]?.headline).toMatch(/Review 6 drifted policy changes/i);
  });

  it("includes orphan reclaim action when savings are positive", () => {
    const actions = buildExecutiveScorecardRecommendedActions({
      complianceDriftChangeCount: 0,
      orphanCandidates: { candidateCount: 3, annualSavingsUsd: 12000 },
      committedRunsTimeline: [],
    });

    expect(actions.some((action) => action.id === "orphan-candidates")).toBe(true);
    expect(actions[0]?.headline).toMatch(/Reclaim/);
  });

  it("returns empty list for healthy signals", () => {
    const actions = buildExecutiveScorecardRecommendedActions({
      complianceDriftChangeCount: 0,
      orphanCandidates: { candidateCount: 0, annualSavingsUsd: 0 },
      committedRunsTimeline: [
        {
          runId: "run-1",
          createdUtc: "2026-05-01T00:00:00.000Z",
          committedUtc: "2026-05-02T00:00:00.000Z",
          systemName: "Committed",
        },
      ],
    });

    expect(actions).toEqual([]);
  });
});
