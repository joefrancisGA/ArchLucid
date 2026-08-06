import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  reviewsHubLifecycleStage,
  reviewsHubNeedsAttention,
  reviewsHubOverallStatus,
  reviewsHubOverallStatusTagKind,
} from "./reviews-hub-review-status";

describe("reviews-hub-review-status", () => {
  it("maps finalized reviews", () => {
    const run = {
      runId: "finalized",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      hasGoldenManifest: true,
    } satisfies RunSummary;

    expect(reviewsHubOverallStatus(run)).toBe("Finalized");
    expect(reviewsHubLifecycleStage(run)).toBe("Approval");
    expect(reviewsHubNeedsAttention(run)).toBe(false);
  });

  it("maps active evaluation reviews", () => {
    const run = {
      runId: "active",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      hasFindingsSnapshot: true,
      findingCount: 1,
    } satisfies RunSummary;

    expect(reviewsHubOverallStatus(run)).toBe("Active");
    expect(reviewsHubLifecycleStage(run)).toBe("Evaluation");
    expect(reviewsHubNeedsAttention(run)).toBe(true);
  });

  it("maps StatusTag kinds for inventory badges", () => {
    expect(reviewsHubOverallStatusTagKind("Draft", false)).toBe("draft");
    expect(reviewsHubOverallStatusTagKind("Active", false)).toBe("in-progress");
    expect(reviewsHubOverallStatusTagKind("Finalized", false)).toBe("approved");
    expect(reviewsHubOverallStatusTagKind("Active", true)).toBe("needs-attention");
  });

  it("maps archived reviews", () => {
    const run = {
      runId: "archived",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      isArchived: true,
    } satisfies RunSummary;

    expect(reviewsHubOverallStatus(run)).toBe("Archived");
  });
});
