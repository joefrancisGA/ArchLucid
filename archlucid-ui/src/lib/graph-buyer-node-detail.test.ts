import { describe, expect, it } from "vitest";

import { graphBuyerTrailRecordTypeLine } from "./graph-buyer-node-detail";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "./showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

describe("graphBuyerTrailRecordTypeLine", () => {
  it("labels active sample hero finding with scenario-specific risk framing", () => {
    const node: GraphNodeVm = {
      id: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
      type: "Finding",
      label: "Sensitive data minimization risk",
      metadata: { referenced: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID },
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Sensitive data minimization",
      secondary: "Risk area: Privacy and data handling",
    });
  });

  it("labels generic finding nodes as Finding", () => {
    const node: GraphNodeVm = {
      id: "finding-other",
      type: "Finding",
      label: "Other finding",
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding",
      secondary: null,
    });
  });
});
