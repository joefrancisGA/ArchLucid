import { describe, expect, it } from "vitest";

import { buildDiagramWalkthrough } from "@/lib/infra-evidence/build-diagram-walkthrough";
import { buildDiagramNodeExplain, DIAGRAM_NODE_EXPLAIN_SEED_NOT_STORED } from "@/lib/infra-evidence/build-diagram-node-explain";

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
        source: "observed" as const,
        declaredConnectionId: null,
      })),
    });

    expect(summary).toContain("11");
    expect(summary).toContain("6");
    expect(summary).toContain("stored inventory");
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
      edges: [{ from: "a", to: "b", label: null, source: "observed", declaredConnectionId: null }],
    });

    expect(summary).toContain("stored inventory");
    expect(summary).toContain("2 connected components");
  });

  it("splits relationship counts by evidence source", () => {
    const summary = buildDiagramWalkthrough({
      nodes: [],
      edges: [
        { from: "a", to: "b", label: null, source: "observed", declaredConnectionId: null },
        { from: "b", to: "c", label: null, source: "declared", declaredConnectionId: null },
        { from: "c", to: "d", label: null, source: "inferred", declaredConnectionId: null },
      ],
    });

    expect(summary).toContain("1 observed, 1 declared, 1 inferred");
    expect(summary).toContain(
      "Declared, probable, and inferred relationships are on this inventory diagram.",
    );
    expect(summary).not.toContain("visible relationships");
  });
});

describe("buildDiagramNodeExplain", () => {
  it("labels missing seed id separately from not-verifiable provenance", () => {
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
    ).toBe(DIAGRAM_NODE_EXPLAIN_SEED_NOT_STORED);

    expect(
      buildDiagramNodeExplain(
        {
          id: "a",
          label: "Gateway",
          resourceType: null,
          resourceGroup: null,
          seedNodeId: "22222222-2222-2222-2222-222222222222",
        },
        "not-verifiable",
      ),
    ).toBe("Not verifiable from this diagram source.");
  });
});
