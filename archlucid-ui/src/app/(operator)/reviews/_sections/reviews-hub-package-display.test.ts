import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import { toReviewsHubPackageRowDisplay } from "./reviews-hub-package-display";

describe("toReviewsHubPackageRowDisplay", () => {
  it("marks the showcase package as a sample row with governance and counts", () => {
    const row = toReviewsHubPackageRowDisplay({
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      projectId: "default",
      createdUtc: "2026-01-14T12:00:00.000Z",
      hasGoldenManifest: true,
      hasFindingsSnapshot: true,
      hasGraphSnapshot: true,
      hasContextSnapshot: true,
      isSample: true,
    } satisfies RunSummary);

    expect(row.isSamplePackage).toBe(true);
    expect(row.findingsCount).toBeGreaterThan(0);
    expect(row.governanceState).toBe("Approved");
    expect(row.primaryAction.href).toContain(SHOWCASE_STATIC_DEMO_RUN_ID);
  });

  it("describes in-progress packages without completion messaging", () => {
    const row = toReviewsHubPackageRowDisplay({
      runId: "draft-review",
      projectId: "default",
      createdUtc: "2026-01-20T12:00:00.000Z",
      hasFindingsSnapshot: true,
      findingCount: 2,
    } satisfies RunSummary);

    expect(row.statusLabel).toBe("In progress");
    expect(row.governanceState).toBe("Not ready");
    expect(row.findingsCount).toBe(2);
  });
});
