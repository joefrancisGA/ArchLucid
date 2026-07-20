import { describe, expect, it } from "vitest";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS, resolveBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { getShowcaseExecutiveHref, getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/finding-inspect-graph-evidence";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

describe("BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS", () => {
  it("includes graphNodeId on evidence trail step for pre-focused demo graph", () => {
    const evidenceStep = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.find((def) => def.step === 3);

    expect(evidenceStep).toBeDefined();
    expect(evidenceStep?.href).toContain(`graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`);
  });
});

describe("resolveBuyerGoldenJourneyNav", () => {
  it("recognizes pinned SQL demo workspace executive and spine query routes", () => {
    expect(resolveBuyerGoldenJourneyNav(getShowcaseExecutiveHref())?.currentStepIndex).toBe(0);
    expect(resolveBuyerGoldenJourneyNav(getShowcaseManifestHref())?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav(`/graph?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(2);
    expect(
      resolveBuyerGoldenJourneyNav(
        `/reviews/${showcaseRunEnc}/findings/${encodeURIComponent("phi-minimization-risk")}/inspect`,
      )?.currentStepIndex,
    ).toBe(2);
    expect(resolveBuyerGoldenJourneyNav(`/governance?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(3);
    expect(resolveBuyerGoldenJourneyNav(`/audit?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(4);
  });

  it("recognizes live demo workspace A product tour run ids on the buyer golden spine", () => {
    const liveRunId = "b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf";
    const liveRunEnc = encodeURIComponent(liveRunId);

    expect(resolveBuyerGoldenJourneyNav(`/reviews/${liveRunEnc}`)?.currentStepIndex).toBe(0);
    expect(resolveBuyerGoldenJourneyNav(`/reviews/${liveRunEnc}/signed-record`)?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav(`/graph?runId=${liveRunEnc}`)?.currentStepIndex).toBe(2);
    expect(resolveBuyerGoldenJourneyNav(`/governance?runId=${liveRunEnc}`)?.currentStepIndex).toBe(3);
    expect(resolveBuyerGoldenJourneyNav(`/audit?runId=${liveRunEnc}`)?.currentStepIndex).toBe(4);
  });

  it("recognizes live SQL golden manifest detail under /signed-records/{guid}", () => {
    const liveGoldenManifestId = "495ab97d-9f1b-d4f1-761e-f5406a636db3";

    expect(resolveBuyerGoldenJourneyNav(`/signed-records/${liveGoldenManifestId}`)?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav("/signed-records")).toBeNull();
  });
});
