import { describe, expect, it } from "vitest";

import {
  collectReviewsHubDecisionBlockers,
  REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER,
} from "@/lib/reviews/reviews-hub-decision-blocker-queue";
import type { RunSummary } from "@/types/authority";

function minimalRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-a",
    createdUtc: new Date().toISOString(),
    hasFindingsSnapshot: true,
    hasGoldenManifest: false,
    hasContextSnapshot: true,
    ...overrides,
  } as RunSummary;
}

describe("collectReviewsHubDecisionBlockers", () => {
  it("does not imply SOC attestation in helper copy", () => {
    expect(REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER).toContain("not a compliance score");
  });

  it("returns rows waiting on you", () => {
    const rows = collectReviewsHubDecisionBlockers([
      minimalRun({ runId: "run-blocked", hasFindingsSnapshot: true }),
      minimalRun({ runId: "run-final", hasGoldenManifest: true }),
    ]);

    expect(rows.some((row) => row.runId === "run-blocked")).toBe(true);
    expect(rows.some((row) => row.runId === "run-final")).toBe(false);
  });
});
