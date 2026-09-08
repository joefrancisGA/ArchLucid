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
    expect(row.governanceState).toBe("Approved");
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

  it("AO-26: uses nested review href in Working mode when parent architecture id is known", () => {
    const row = toReviewsHubReviewRowDisplay(
      {
        runId: "run-001",
        projectId: "default",
        createdUtc: "2026-01-15T12:00:00.000Z",
      } satisfies RunSummary,
      {
        draftRegistryEntries: [
          {
            draftId: "draft-001",
            displayName: "Payments",
            customerStatus: "in-review",
            ownerLabel: "You",
            lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
            linkedReviewId: "run-001",
            serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
            parentArchitectureId: "architecture-identity-001",
          },
        ],
      },
      [],
      { isWorkingMode: true },
    );

    expect(row.reviewHref).toBe("/architecture/architectures/architecture-identity-001/reviews/run-001");
    expect(row.architectureDeskHref).toBe("/architecture/architectures/architecture-identity-001");
    expect(row.reviewHref).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });

  it("labels unlinked jobs honestly in Working inbox rows (AO-49)", () => {
    const row = toReviewsHubReviewRowDisplay(
      {
        runId: "run-unlinked",
        projectId: "Payments",
        createdUtc: "2026-01-20T12:00:00.000Z",
      } satisfies RunSummary,
      {},
      [],
      { isWorkingMode: true },
    );

    expect(row.architectureName).toBe("Unlinked review");
    expect(row.architectureDeskHref).toBeNull();
  });
});
