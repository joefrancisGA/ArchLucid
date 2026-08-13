import { describe, expect, it } from "vitest";

import {
  architectureDiagramModelToMermaid,
  architectureDiagramModelToTextAlternative,
  isValidMermaidArchitectureDiagram,
} from "@/lib/architecture/architecture-diagram-mermaid";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";

const modelWithBoundary: ArchitectureDiagramModel = {
  nodes: [
    {
      id: "user_analyst",
      label: "Claims analyst",
      kind: "user",
      provenance: "asserted",
      removed: false,
      accepted: true,
    },
    {
      id: "system_api",
      label: "Claims API",
      kind: "system",
      provenance: "asserted",
      removed: false,
      accepted: true,
    },
    {
      id: "external_gateway",
      label: "Payment gateway",
      kind: "external",
      provenance: "asserted",
      removed: false,
      accepted: true,
    },
  ],
  edges: [
    {
      id: "edge_1",
      sourceId: "user_analyst",
      targetId: "system_api",
      label: "submit claim",
      provenance: "inferred",
      removed: false,
    },
  ],
  trustBoundaryLabels: ["Corporate network"],
};

describe("architectureDiagramModelToMermaid", () => {
  it("accepts flowchart sources and rejects invalid text", () => {
    expect(isValidMermaidArchitectureDiagram('flowchart TB\n  a["A"]')).toBe(true);
    expect(isValidMermaidArchitectureDiagram("not a diagram")).toBe(false);
  });

  it("keeps external and user nodes outside the trust boundary subgraph", () => {
    const mermaid = architectureDiagramModelToMermaid(modelWithBoundary);

    expect(mermaid).toContain('subgraph trustBoundary["Corporate network"]');
    expect(mermaid).not.toContain('subgraph trustBoundary["Trust boundary"]');
    expect(mermaid).toContain('    system_api["Claims API"]');
    expect(mermaid).toContain('  user_analyst["Claims analyst"]');
    expect(mermaid).toContain('  external_gateway["Payment gateway"]');
    const subgraphBody = mermaid.split("  end")[0] ?? "";
    expect(subgraphBody).not.toContain("external_gateway");
    expect(subgraphBody).not.toContain("user_analyst");
  });

  it("marks inferred edges in labels and text alternative with human names", () => {
    const mermaid = architectureDiagramModelToMermaid(modelWithBoundary);
    const alt = architectureDiagramModelToTextAlternative(modelWithBoundary);

    expect(mermaid).toContain("submit claim (inferred)");
    expect(alt).toContain("Claims analyst to Claims API (submit claim) (inferred)");
    expect(alt).not.toContain("user_analyst to system_api");
  });

  it("omits trust boundary subgraph when no system nodes map inside", () => {
    const externalOnly: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "external_gateway",
          label: "Payment gateway",
          kind: "external",
          provenance: "asserted",
          removed: false,
          accepted: true,
        },
      ],
      edges: [],
      trustBoundaryLabels: ["Corporate network"],
    };

    const mermaid = architectureDiagramModelToMermaid(externalOnly);

    expect(mermaid).not.toContain("subgraph trustBoundary");
  });
});
