import { describe, expect, it } from "vitest";

import { resolvePipelineJobLabel, resolveRunSummaryPackageOrigin } from "@/lib/architecture/architecture-package-origin";
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

describe("resolvePipelineJobLabel", () => {
  it("uses creation copy for Created-origin runs", () => {
    const label = resolvePipelineJobLabel(
      { runId: "run-a", projectId: "default", packageOrigin: "Created" },
      false,
    );

    expect(label.heading).toBe("Architecture creation progress");
    expect(label.stageSummaryNoun).toBe("architecture creation");
  });

  it("uses review copy for Reviewed-origin runs", () => {
    const label = resolvePipelineJobLabel(
      { runId: "run-b", projectId: "default", packageOrigin: "Reviewed" },
      false,
    );

    expect(label.heading).toBe("Assessment progress");
    expect(label.stageSummaryNoun).toBe("assessment");
  });
});
