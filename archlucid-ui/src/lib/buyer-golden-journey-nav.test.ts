import { describe, expect, it } from "vitest";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS, resolveBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/finding-inspect-graph-evidence";

const WORKSPACE_A_RUN_ID = "b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf";

describe("BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS", () => {
  it("includes graphNodeId on evidence trail step for pre-focused demo graph", () => {
    const evidenceStep = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.find((def) => def.step === 3);

    expect(evidenceStep).toBeDefined();
    expect(evidenceStep?.href).toContain(`graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`);
  });
});

describe("resolveBuyerGoldenJourneyNav", () => {
  it("recognizes pinned SQL demo workspace executive and spine query routes", () => {
    const runEnc = encodeURIComponent(WORKSPACE_A_RUN_ID);

    expect(resolveBuyerGoldenJourneyNav(`/reviews/${runEnc}`)?.currentStepIndex).toBe(0);
    expect(
      resolveBuyerGoldenJourneyNav(`/reviews/${runEnc}/signed-record`)?.currentStepIndex,
    ).toBe(1);
    expect(
      resolveBuyerGoldenJourneyNav(`/graph?runId=${runEnc}`)?.currentStepIndex,
    ).toBe(2);
    expect(
      resolveBuyerGoldenJourneyNav(`/governance?runId=${runEnc}`)?.currentStepIndex,
    ).toBe(3);
    expect(resolveBuyerGoldenJourneyNav(`/audit?runId=${runEnc}`)?.currentStepIndex).toBe(4);
  });
});
