import { describe, expect, it } from "vitest";

import { graphBuyerTrailRecordTypeLine } from "./graph-buyer-node-detail";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "./showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

describe("graphBuyerTrailRecordTypeLine", () => {
  it("labels PHI hero finding as risk finding with risk area", () => {
    const node: GraphNodeVm = {
      id: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
      type: "Finding",
      label: "PHI minimization risk",
      metadata: { referenced: "phi-minimization-risk" },
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: PHI minimization",
      secondary: "Risk area: PHI handling",
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
