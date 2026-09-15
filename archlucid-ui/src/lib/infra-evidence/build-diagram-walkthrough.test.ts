import { describe, expect, it } from "vitest";

import { buildDiagramWalkthrough } from "@/lib/infra-evidence/build-diagram-walkthrough";
import { buildDiagramNodeExplain } from "@/lib/infra-evidence/build-diagram-node-explain";

describe("buildDiagramWalkthrough", () => {
  it("includes owner-shape counts without inventing ARM ids", () => {
    const summary = buildDiagramWalkthrough({
      nodes: Array.from({ length: 11 }, (_, index) => ({
        id: `n${index}`,
        label: `Node ${index}`,
        resourceType: null,
        resourceGroup: null,
      })),
      edges: Array.from({ length: 6 }, (_, index) => ({
        from: `n${index}`,
        to: `n${index + 1}`,
        label: null,
      })),
    });

    expect(summary).toContain("11");
    expect(summary).toContain("6");
    expect(summary).toContain("5 connected components");
    expect(summary).not.toMatch(/\/subscriptions\//u);
  });

  it("counts singleton components in the walkthrough", () => {
    const summary = buildDiagramWalkthrough({
      nodes: [
        { id: "a", label: "A", resourceType: null, resourceGroup: null },
        { id: "b", label: "B", resourceType: null, resourceGroup: null },
        { id: "c", label: "C", resourceType: null, resourceGroup: null },
      ],
      edges: [{ from: "a", to: "b", label: null }],
    });

    expect(summary).toContain("2 connected components");
  });
});

describe("buildDiagramNodeExplain", () => {
  it("does not fabricate ARM id when outline cell is empty", () => {
    expect(
      buildDiagramNodeExplain(
        {
          id: "a",
          label: "Gateway",
          resourceType: null,
          resourceGroup: null,
          seedNodeId: null,
        },
        "evidence-backed",
      ),
    ).toBe("Not verifiable from this diagram source.");
  });
});
