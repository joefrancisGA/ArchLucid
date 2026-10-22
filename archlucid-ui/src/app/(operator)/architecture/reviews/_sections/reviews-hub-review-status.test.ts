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
    expect(reviewsHubLifecycleStage(run)).toBe("Finalized");
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

  it("keeps the stage an archived review actually reached instead of reporting it as finalized", () => {
    const run = {
      runId: "archived-draft",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      isArchived: true,
    } satisfies RunSummary;

    expect(reviewsHubLifecycleStage(run)).toBe("Architecture definition");
  });

  it("reports a signed manifest as Finalized so the stage never collides with the approval queue", () => {
    const run = {
      runId: "awaiting-governance",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
    } satisfies RunSummary;

    expect(reviewsHubOverallStatus(run)).toBe("Active");
    expect(reviewsHubLifecycleStage(run)).toBe("Finalized");
  });

  it("maps evidence collection before findings exist", () => {
    const run = {
      runId: "evidence",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00.000Z",
      hasContextSnapshot: true,
    } satisfies RunSummary;

    expect(reviewsHubLifecycleStage(run)).toBe("Evidence collection");
  });
});
