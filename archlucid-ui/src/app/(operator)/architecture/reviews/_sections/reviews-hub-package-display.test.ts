import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import { toReviewsHubReviewRowDisplay } from "./reviews-hub-package-display";

describe("toReviewsHubReviewRowDisplay", () => {
  it("marks the showcase review as a sample row with governance and counts", () => {
    const row = toReviewsHubReviewRowDisplay({
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      createdUtc: "2026-01-14T12:00:00.000Z",
      hasGoldenManifest: true,
      hasFindingsSnapshot: true,
      hasGraphSnapshot: true,
      hasContextSnapshot: true,
      isSample: true,
    } satisfies RunSummary);

    expect(row.isSampleReview).toBe(true);
    expect(row.findingsCount).toBeGreaterThan(0);
    expect(row.governanceState).toBe("Ready for governance");
    expect(row.overallStatus).toBe("Finalized");
    expect(row.primaryAction.label).toBe("View finalized review");
    expect(row.primaryAction.href).toContain(SHOWCASE_STATIC_DEMO_RUN_ID);
  });

  it("describes active in-progress reviews with evaluation stage", () => {
    const row = toReviewsHubReviewRowDisplay({
      runId: "draft-review",
      projectId: "default",
      createdUtc: "2026-01-20T12:00:00.000Z",
      hasFindingsSnapshot: true,
      findingCount: 2,
    } satisfies RunSummary);

    expect(row.overallStatus).toBe("Active");
    expect(row.lifecycleStage).toBe("Evaluation");
    expect(row.governanceState).toBe("Not submitted");
    expect(row.findingsCount).toBe(2);
    expect(row.primaryAction.label).toBe("Review findings");
  });

  it("describes draft reviews at architecture definition", () => {
    const row = toReviewsHubReviewRowDisplay({
      runId: "new-review",
      projectId: "default",
      createdUtc: "2026-01-21T12:00:00.000Z",
    } satisfies RunSummary);

    expect(row.overallStatus).toBe("Draft");
    expect(row.lifecycleStage).toBe("Architecture definition");
    expect(row.primaryAction.label).toBe("Continue review");
  });

  it("shortens architecture review packet titles for the hub table", () => {
    const row = toReviewsHubReviewRowDisplay({
      runId: "packet-review",
      projectId: "default",
      createdUtc: "2026-01-21T12:00:00.000Z",
      description:
        "# Architecture Review Packet: B2B SaaS Tenant Migration Platform\n\n**Classification:** Synthetic sanitized packet.",
    } satisfies RunSummary);

    expect(row.reviewTitlePrimary).toBe("B2B SaaS Tenant Migration Platform");
    expect(row.reviewTitleKindLabel).toBe("Architecture review packet");
  });

  it("describes archived reviews", () => {
    const row = toReviewsHubReviewRowDisplay({
      runId: "archived-review",
      projectId: "default",
      createdUtc: "2026-01-10T12:00:00.000Z",
      isArchived: true,
    } satisfies RunSummary);

    expect(row.overallStatus).toBe("Archived");
    expect(row.primaryAction.label).toBe("View archived review");
  });
});
