import { describe, expect, it } from "vitest";

import { deriveAttentionSurfaceCounts } from "@/lib/operator/derive-attention-surface-counts";
import type { RunSummary } from "@/types/authority";

describe("derive-attention-surface-counts (TB-2369)", () => {
  it("maps runs and nav projections to inventoried surface counts", () => {
    const runs = [
      {
        runId: "needs-attention",
        projectId: "default",
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
        findingCount: 2,
      },
      {
        runId: "in-progress",
        projectId: "default",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
      {
        runId: "committed",
        projectId: "default",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      },
    ] as RunSummary[];

    const counts = deriveAttentionSurfaceCounts({
      unfinishedWorkRailCount: 2,
      runs,
      assignedToMeFindingsCount: 4,
      awaitingApprovalCount: 1,
      alertsOpenCount: 3,
    });

    expect(counts["unfinished-work-rail"]).toBe(2);
    expect(counts["run-work-queue-needs-attention"]).toBe(1);
    expect(counts["run-work-queue-in-progress"]).toBe(1);
    expect(counts["run-work-queue-committed"]).toBe(1);
    expect(counts["assigned-to-me-findings"]).toBe(4);
    expect(counts["governance-awaiting-nav-badge"]).toBe(1);
    expect(counts["alerts-nav"]).toBe(3);
  });

  it("excludes archived runs from committed and in-progress work-queue surface counts", () => {
    const runs = [
      {
        runId: "active-committed",
        projectId: "default",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      },
      {
        runId: "archived-committed",
        projectId: "default",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
        isArchived: true,
      },
      {
        runId: "archived-in-progress",
        projectId: "default",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
        isArchived: true,
      },
    ] as RunSummary[];

    const counts = deriveAttentionSurfaceCounts({ runs });

    expect(counts["run-work-queue-committed"]).toBe(1);
    expect(counts["run-work-queue-in-progress"]).toBeUndefined();
    expect(counts["run-work-queue-needs-attention"]).toBe(0);
  });
});
