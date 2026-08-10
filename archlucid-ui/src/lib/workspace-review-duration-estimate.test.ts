import { describe, expect, it } from "vitest";

import {
  resolveReviewPipelinePollMaxMs,
  resolveReviewPipelineTimeoutMessage,
} from "@/lib/review-execution-background-safety-copy";
import {
  computeDurationPercentile,
  deriveWorkspaceReviewDurationEstimate,
  formatWorkspaceReviewDurationBand,
} from "@/lib/workspace-review-duration-estimate";
import { makePayload, makeRow } from "@/components/BeforeAfterDelta/__tests__/sharedRecentDeltasHandler";

describe("workspace-review-duration-estimate", () => {
  it("computes p50 and p90 from recent finalized reviews", () => {
    const payload = makePayload([
      makeRow({ runId: "a", timeToCommittedManifestTotalSeconds: 120 }),
      makeRow({ runId: "b", timeToCommittedManifestTotalSeconds: 240 }),
      makeRow({ runId: "c", timeToCommittedManifestTotalSeconds: 360 }),
      makeRow({ runId: "d", timeToCommittedManifestTotalSeconds: 480 }),
    ]);

    const estimate = deriveWorkspaceReviewDurationEstimate(payload);

    expect(estimate).not.toBeNull();
    expect(estimate?.sampleSize).toBe(4);
    expect(estimate?.p50Seconds).toBe(300);
    expect(estimate?.p90Seconds).toBe(444);
    expect(formatWorkspaceReviewDurationBand(estimate!)).toContain("5–7 minutes");
  });

  it("returns null when fewer than two samples exist", () => {
    const payload = makePayload([
      makeRow({ runId: "only", timeToCommittedManifestTotalSeconds: 600 }),
    ]);

    expect(deriveWorkspaceReviewDurationEstimate(payload)).toBeNull();
  });

  it("computes linear interpolation for percentiles", () => {
    expect(computeDurationPercentile([100, 200, 300], 50)).toBe(200);
    expect(computeDurationPercentile([100, 200, 300], 90)).toBe(280);
  });
});

describe("review-execution-background-safety-copy", () => {
  it("extends the poll watchdog when tenant p90 exceeds three minutes", () => {
    expect(resolveReviewPipelinePollMaxMs(120)).toBe(180_000);
    expect(resolveReviewPipelinePollMaxMs(300)).toBeGreaterThan(180_000);
  });

  it("uses extended timeout copy when tenant p90 exceeds three minutes", () => {
    const message = resolveReviewPipelineTimeoutMessage({
      buyerPolished: true,
      runId: "run-1",
      p90Seconds: 420,
    });

    expect(message).toMatch(/often take longer than a few minutes/i);
  });
});
