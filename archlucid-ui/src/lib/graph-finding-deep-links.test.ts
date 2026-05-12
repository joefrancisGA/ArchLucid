import { describe, expect, it } from "vitest";

import {
  findingIdForGraphDeepLink,
  graphFindingDetailHref,
  graphFindingInspectHref,
} from "@/lib/graph-finding-deep-links";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

describe("graph-finding-deep-links", () => {
  it("resolves finding id from referenceId metadata", () => {
    const node: GraphNodeVm = {
      id: "n-x",
      label: "Risk",
      type: "Finding",
      metadata: { referenceId: "phi-minimization-risk" },
    };

    expect(findingIdForGraphDeepLink(node)).toBe("phi-minimization-risk");
  });

  it("falls back to curated id for static demo phi node", () => {
    const node: GraphNodeVm = {
      id: "n-phi",
      label: "PHI minimization risk",
      type: "Finding",
      metadata: {},
    };

    expect(findingIdForGraphDeepLink(node)).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);
  });

  it("builds detail and inspect hrefs", () => {
    expect(graphFindingDetailHref("run-a", "fid-1")).toBe("/reviews/run-a/findings/fid-1");
    expect(graphFindingInspectHref("run-a", "fid-1")).toBe("/reviews/run-a/findings/fid-1/inspect");
  });
});
