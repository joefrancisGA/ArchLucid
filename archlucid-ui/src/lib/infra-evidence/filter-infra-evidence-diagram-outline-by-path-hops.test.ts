import { describe, expect, it } from "vitest";

import { filterInfraEvidenceDiagramOutlineByPathHops } from "@/lib/infra-evidence/filter-infra-evidence-diagram-outline-by-path-hops";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import type { SecurityEvidencePathHop } from "@/lib/security-evidence-path-types";

const outline: InfraEvidenceMermaidOutline = {
  nodes: [
    { id: "node-a", label: "vm-a", resourceType: null, resourceGroup: null },
    { id: "node-b", label: "vm-b", resourceType: null, resourceGroup: null },
    { id: "node-c", label: "vm-c", resourceType: null, resourceGroup: null },
  ],
  edges: [
    { from: "node-a", to: "node-b", label: null, source: "observed", confidenceBand: "observed", provenanceKind: null, inferenceSource: null, declaredConnectionId: null },
    { from: "node-b", to: "node-c", label: null, source: "observed", confidenceBand: "observed", provenanceKind: null, inferenceSource: null, declaredConnectionId: null },
  ],
};

const hops: readonly SecurityEvidencePathHop[] = [
  {
    hopOrdinal: 1,
    fromNodeLabel: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-a",
    toNodeLabel: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-b",
    edgeType: "Allows",
    provenanceKind: "ObservedFact",
    hopConfidenceBand: "High",
    inferenceSource: null,
    evidenceReference: "hop:1",
    cloudResourceId: null,
  },
];

describe("filterInfraEvidenceDiagramOutlineByPathHops", () => {
  it("keeps only nodes and edges on the selected path hops", () => {
    const filtered = filterInfraEvidenceDiagramOutlineByPathHops(outline, hops);

    expect(filtered?.nodes.map((node) => node.id)).toEqual(["node-a", "node-b"]);
    expect(filtered?.edges).toHaveLength(1);
  });

  it("returns the original outline when no hops are provided", () => {
    expect(filterInfraEvidenceDiagramOutlineByPathHops(outline, [])).toBe(outline);
  });
});
