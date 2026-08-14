import { describe, expect, it } from "vitest";

import { getShowcaseStaticDemoPayload, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { buildDemoPreviewAtAGlanceMetrics, computeDemoReviewDurationLabel } from "@/lib/demo-preview-present";

describe("demo-preview-present", () => {
  it("builds at-a-glance metrics from the showcase static payload", () => {
    const payload = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
    const metrics = buildDemoPreviewAtAGlanceMetrics(payload);

    expect(metrics.status).toBe("Finalized");
    expect(metrics.policyPack).toContain("Enterprise Privacy Policy Pack");
    expect(metrics.decisions).toBe("12");
    expect(metrics.monitoredRisks).toBe("1");
    expect(metrics.unresolvedIssues).toBe("0");
    expect(metrics.deliverablesProduced).toBe("4");
    expect(metrics.overallAssessment).toContain("Proceed with claims intake modernization");
  });

  it("computes review duration from timeline bounds", () => {
    const payload = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
    const duration = computeDemoReviewDurationLabel(payload.pipelineTimeline, payload.run.createdUtc);

    expect(duration).toBe("24 days");
  });
});
