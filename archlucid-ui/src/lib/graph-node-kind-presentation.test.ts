import { describe, expect, it } from "vitest";

import {
  GRAPH_NODE_KIND_LEGEND_ENTRIES,
  graphNodeKindCssVar,
  graphNodeKindPresentation,
  resolveGraphNodeKindBuyerLabel,
  resolveGraphNodeKindKey,
} from "@/lib/graph-node-kind-presentation";

describe("graph-node-kind-presentation", () => {
  it("maps API node types to the five legend categories", () => {
    expect(resolveGraphNodeKindKey("Decision")).toBe("decision");
    expect(resolveGraphNodeKindKey("Finding")).toBe("finding");
    expect(resolveGraphNodeKindKey("ArtifactBundle")).toBe("artifact");
    expect(resolveGraphNodeKindKey("GoldenManifest")).toBe("review");
    expect(resolveGraphNodeKindKey("ContextSnapshot")).toBe("component");
    expect(resolveGraphNodeKindKey("UnknownKind")).toBe("default");
  });

  it("uses the same CSS variables for legend swatch and node fill per kind", () => {
    for (const entry of GRAPH_NODE_KIND_LEGEND_ENTRIES) {
      const presentation = graphNodeKindPresentation(entry.key);

      expect(presentation.background).toBe(graphNodeKindCssVar(entry.key, "bg"));
      expect(presentation.swatch).toBe(graphNodeKindCssVar(entry.key, "swatch"));
      expect(presentation.border).toBe(graphNodeKindCssVar(entry.key, "border"));
    }
  });

  it("exposes buyer type captions for categorized nodes", () => {
    expect(resolveGraphNodeKindBuyerLabel("Finding")).toBe("Finding");
    expect(resolveGraphNodeKindBuyerLabel("GoldenManifest")).toBe("Review");
    expect(resolveGraphNodeKindBuyerLabel("UnknownKind")).toBeNull();
  });
});
