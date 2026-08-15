import { describe, expect, it } from "vitest";

import {
  parseLiveDemoWalkthroughStepId,
  liveDemoWalkthroughStepIndex,
} from "@/lib/live-demo-walkthrough-steps";
import { resolveLiveDemoInspectHref } from "@/lib/live-demo-public-links";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("live-demo-walkthrough-steps", () => {
  it("parses step query aliases", () => {
    expect(parseLiveDemoWalkthroughStepId("signed")).toBe("signed-record");
    expect(parseLiveDemoWalkthroughStepId("evidence-graph")).toBe("evidence");
    expect(parseLiveDemoWalkthroughStepId("audit")).toBe("audit-trail");
    expect(parseLiveDemoWalkthroughStepId(null)).toBe("sponsor");
  });

  it("resolves step index", () => {
    expect(liveDemoWalkthroughStepIndex("governance")).toBe(3);
  });
});

describe("live-demo-public-links", () => {
  it("routes anonymous visitors to showcase when operator deep links unavailable", () => {
    const href = resolveLiveDemoInspectHref(
      "evidence-graph",
      SHOWCASE_STATIC_DEMO_RUN_ID,
      "manifest-id",
      false,
    );

    expect(href).toBe(`/showcase/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
  });

  it("routes to operator graph when deep links available", () => {
    const href = resolveLiveDemoInspectHref(
      "evidence-graph",
      SHOWCASE_STATIC_DEMO_RUN_ID,
      "manifest-id",
      true,
    );

    expect(href).toBe(`/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
  });
});
