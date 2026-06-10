import { describe, expect, it } from "vitest";

import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/finding-inspect-graph-evidence";

describe("BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS", () => {
  it("includes graphNodeId on evidence trail step for pre-focused demo graph", () => {
    const evidenceStep = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.find((def) => def.step === 3);

    expect(evidenceStep).toBeDefined();
    expect(evidenceStep?.href).toContain(`graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`);
  });
});
