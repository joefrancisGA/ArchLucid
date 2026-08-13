import { describe, expect, it } from "vitest";

import { resolveRunSummaryPackageOrigin } from "@/lib/architecture/architecture-package-origin";
import { SHOWCASE_SAMPLE_CREATED_REGISTRY } from "@/lib/showcase-sample-created-registry";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("resolveRunSummaryPackageOrigin", () => {
  it("maps API Created and Reviewed labels", () => {
    expect(
      resolveRunSummaryPackageOrigin({
        runId: "run-a",
        projectId: "default",
        packageOrigin: "Created",
      }),
    ).toBe("created");

    expect(
      resolveRunSummaryPackageOrigin({
        runId: "run-b",
        projectId: "default",
        packageOrigin: "Reviewed",
      }),
    ).toBe("reviewed");
  });

  it("falls back to showcase registries for static demo run ids", () => {
    expect(
      resolveRunSummaryPackageOrigin({
        runId: SHOWCASE_SAMPLE_CREATED_REGISTRY.runId,
        projectId: "default",
      }),
    ).toBe("created");

    expect(
      resolveRunSummaryPackageOrigin({
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        projectId: "default",
      }),
    ).toBe("reviewed");
  });
});
