import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type { GraphViewModel } from "@/types/graph";

/** Maps coordinator provenance linkage (review-trail shape) to the graph viewer contract. */
export function provenanceLinkageToGraphViewModel(graph: ArchitectureRunProvenanceGraph): GraphViewModel {
  return {
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      label: n.name,
      type: n.type,
      metadata: { ...(n.metadata ?? {}), referenceId: n.referenceId },
    })),
    edges: graph.edges.map((e) => ({
      source: e.fromNodeId,
      target: e.toNodeId,
      type: e.type,
    })),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
  };
}
