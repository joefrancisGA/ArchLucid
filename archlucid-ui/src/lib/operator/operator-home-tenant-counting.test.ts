import { describe, expect, it } from "vitest";

import { deriveOperatorHomeTenantCountingSnapshot } from "@/lib/operator/operator-home-tenant-counting";
import type { RunSummary } from "@/types/authority";

describe("deriveOperatorHomeTenantCountingSnapshot", () => {
  it("scopes metrics and preview counts to tenant-authored reviews", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-1",
        projectId: "default",
        hasGoldenManifest: true,
        findingCount: 2,
        hasFindingsSnapshot: true,
      },
      {
        runId: "demo-seed",
        projectId: "default",
        demoSeededOverviewInject: true,
        hasGoldenManifest: true,
      },
      {
        runId: "tenant-2",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-3",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items.filter((run) => run.runId?.startsWith("tenant-")),
    });

    expect(snapshot.tenantItems).toHaveLength(3);
    expect(snapshot.metrics.reviewPackagesCommitted).toBe(1);
    expect(snapshot.metrics.reviewPackagesActive).toBe(2);
    expect(snapshot.previewTabCounts.recentTotalCount).toBe(3);
    expect(snapshot.previewTabCounts.recentVisibleCount).toBe(2);
    expect(snapshot.previewTabCounts.all).toBe(2);
  });
});
