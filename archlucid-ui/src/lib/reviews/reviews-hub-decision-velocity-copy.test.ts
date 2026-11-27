import { describe, expect, it } from "vitest";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  resolveReviewsHubDecisionSlaBadge,
  resolveReviewsHubWaitingOnKind,
} from "@/lib/reviews/reviews-hub-decision-velocity-copy";
import type { RunSummary } from "@/types/authority";

describe("reviews-hub-decision-velocity-copy", () => {
  it("flags demo approval rows and waiting-on parties", () => {
    const approvalRow = {
      runId: "claims-intake-pending-governance-002",
      projectId: "p",
      createdUtc: "2026-01-01T00:00:00Z",
      hasGoldenManifest: true,
      hasFindingsSnapshot: true,
    } as RunSummary;
    expect(resolveReviewsHubDecisionSlaBadge(approvalRow)).toBe("Decision due");
    expect(resolveReviewsHubWaitingOnKind(approvalRow)).toBe("them");

    const inProgressRow = {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "p",
      createdUtc: "2026-01-01T00:00:00Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    } as RunSummary;
    expect(resolveReviewsHubWaitingOnKind(inProgressRow)).toBe("you");
  });
});
