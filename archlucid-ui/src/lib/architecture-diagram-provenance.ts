import type { ArchitectureDiagramModel } from "@/lib/architecture-diagram-types";

export type ArchitectureDiagramProvenanceSummary = {
  readonly assertedNodeCount: number;
  readonly inferredNodeCount: number;
  readonly assertedEdgeCount: number;
  readonly inferredEdgeCount: number;
  readonly unconfirmedInferredCount: number;
};

export function summarizeArchitectureDiagramProvenance(
  model: ArchitectureDiagramModel | null,
): ArchitectureDiagramProvenanceSummary {
  if (model === null) {
    return {
      assertedNodeCount: 0,
      inferredNodeCount: 0,
      assertedEdgeCount: 0,
      inferredEdgeCount: 0,
      unconfirmedInferredCount: 0,
    };
  }

  const activeNodes = model.nodes.filter((node) => !node.removed);
  const activeEdges = model.edges.filter((edge) => !edge.removed);
  const assertedNodeCount = activeNodes.filter((node) => node.provenance === "asserted" || node.accepted).length;
  const inferredNodeCount = activeNodes.filter(
    (node) => node.provenance === "inferred" && !node.accepted,
  ).length;
  const assertedEdgeCount = activeEdges.filter((edge) => edge.provenance === "asserted").length;
  const inferredEdgeCount = activeEdges.filter((edge) => edge.provenance === "inferred").length;

  return {
    assertedNodeCount,
    inferredNodeCount,
    assertedEdgeCount,
    inferredEdgeCount,
    unconfirmedInferredCount: inferredNodeCount + inferredEdgeCount,
  };
}
