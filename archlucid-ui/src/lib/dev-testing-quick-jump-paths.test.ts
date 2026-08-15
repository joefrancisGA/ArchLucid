import { describe, expect, it } from "vitest";

import {
  devTestingApprovalLineagePath,
  devTestingManifestArtifactPath,
  devTestingManifestDetailPath,
  devTestingPlanDetailPath,
  devTestingRunDetailPath,
} from "@/lib/dev-testing-quick-jump-paths";

describe("dev-testing-quick-jump-paths", () => {
  it("builds encoded entity detail paths", () => {
    expect(devTestingPlanDetailPath("plan-1")).toBe("/insights/improvement-planning/plans/plan-1");
    expect(devTestingRunDetailPath("run-1")).toBe("/architecture/reviews/run-1");
    expect(devTestingApprovalLineagePath("approval-1")).toBe(
      "/governance/approval-requests/approval-1/lineage",
    );
    expect(devTestingManifestDetailPath("manifest-1")).toBe("/governance/sealed-records/manifest-1");
    expect(devTestingManifestArtifactPath("manifest-1", "artifact-1")).toBe(
      "/governance/sealed-records/manifest-1/artifacts/artifact-1",
    );
  });
});
