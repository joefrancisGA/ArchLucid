import { describe, expect, it } from "vitest";

import { resolveBuyerTrailPathBreadcrumb } from "@/lib/graph-buyer-path-filter";
import type { GraphViewModel } from "@/types/graph";

describe("resolveBuyerTrailPathBreadcrumb", () => {
  const graph: GraphViewModel = {
    nodes: [
      { id: "ev", label: "Source", type: "Artifact" },
      { id: "f1", label: "PHI risk", type: "Finding" },
      { id: "d1", label: "Accept", type: "Decision" },
      { id: "gm", label: "Sealed record", type: "GoldenManifest" },
    ],
    edges: [
      { id: "e1", source: "ev", target: "f1", type: "supports" },
      { id: "e2", source: "f1", target: "d1", type: "drives" },
      { id: "e3", source: "d1", target: "gm", type: "packaged" },
    ],
  };

  it("returns an ordered trail from the selected finding to the review", () => {
    expect(resolveBuyerTrailPathBreadcrumb(graph, "f1")).toEqual([
      "Finding",
      "Decision",
      "Review",
    ]);
  });

  it("returns a single label when the review node itself is selected", () => {
    expect(resolveBuyerTrailPathBreadcrumb(graph, "gm")).toEqual(["Review"]);
  });
});
