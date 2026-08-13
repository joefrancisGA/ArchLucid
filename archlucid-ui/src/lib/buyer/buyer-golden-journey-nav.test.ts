import { describe, expect, it } from "vitest";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS, resolveBuyerGoldenJourneyNav } from "@/lib/buyer/buyer-golden-journey-nav";
import { getShowcaseSponsorHref, getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

describe("BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS", () => {
  it("includes graphNodeId on evidence graph step for pre-focused demo graph", () => {
    const evidenceStep = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.find((def) => def.step === 3);

    expect(evidenceStep).toBeDefined();
    expect(evidenceStep?.label).toBe("Evidence graph");
    expect(evidenceStep?.href).toContain(`graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`);
  });
});

describe("resolveBuyerGoldenJourneyNav", () => {
  it("recognizes pinned SQL demo workspace sponsor and spine query routes", () => {
    expect(resolveBuyerGoldenJourneyNav(getShowcaseSponsorHref())?.currentStepIndex).toBe(0);
    expect(resolveBuyerGoldenJourneyNav(getShowcaseManifestHref())?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav(`/insights/evidence-graph?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(2);
    expect(
      resolveBuyerGoldenJourneyNav(
        `/architecture/reviews/${showcaseRunEnc}/findings/${encodeURIComponent("phi-minimization-risk")}/evidence-trace`,
      )?.currentStepIndex,
    ).toBe(2);
    expect(resolveBuyerGoldenJourneyNav(`/governance/approval-queue?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(3);
    expect(resolveBuyerGoldenJourneyNav(`/audit?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(4);
    expect(resolveBuyerGoldenJourneyNav(`/governance/audit?runId=${showcaseRunEnc}`)?.currentStepIndex).toBe(4);
  });

  it("uses canonical /governance/audit for audit trail step href", () => {
    const auditStep = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.find((def) => def.step === 5);

    expect(auditStep?.href).toBe(`/governance/audit?runId=${showcaseRunEnc}`);
  });

  it("recognizes live demo workspace A product tour run ids on the buyer golden spine", () => {
    const liveRunId = "b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf";
    const liveRunEnc = encodeURIComponent(liveRunId);
    const liveGoldenManifestId = "495ab97d-9f1b-d4f1-761e-f5406a636db3";

    expect(resolveBuyerGoldenJourneyNav(`/architecture/reviews/${liveRunEnc}`)?.currentStepIndex).toBe(0);
    expect(resolveBuyerGoldenJourneyNav(`/governance/signed-records/${liveGoldenManifestId}`)?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav(`/insights/evidence-graph?runId=${liveRunEnc}`)?.currentStepIndex).toBe(2);
    expect(resolveBuyerGoldenJourneyNav(`/governance/approval-queue?runId=${liveRunEnc}`)?.currentStepIndex).toBe(3);
    expect(resolveBuyerGoldenJourneyNav(`/audit?runId=${liveRunEnc}`)?.currentStepIndex).toBe(4);
    expect(resolveBuyerGoldenJourneyNav(`/governance/audit?runId=${liveRunEnc}`)?.currentStepIndex).toBe(4);
  });

  it("recognizes live SQL golden manifest detail under canonical and legacy signed-record paths", () => {
    const liveGoldenManifestId = "495ab97d-9f1b-d4f1-761e-f5406a636db3";

    expect(resolveBuyerGoldenJourneyNav(`/governance/signed-records/${liveGoldenManifestId}`)?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav(`/signed-records/${liveGoldenManifestId}`)?.currentStepIndex).toBe(1);
    expect(resolveBuyerGoldenJourneyNav("/signed-records")).toBeNull();
  });
});
