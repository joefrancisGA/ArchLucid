import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type { GraphViewModel } from "@/types/graph";
import { applyBuyerLabelsToProvenanceGraphViewModel } from "@/lib/provenance-graph-presentation";

type ProvenanceVmOptions = {
  readonly buyerFacingLabels?: boolean;
};

/** Maps coordinator provenance linkage (review-trail shape) to the graph viewer contract. */
export function provenanceLinkageToGraphViewModel(
  graph: ArchitectureRunProvenanceGraph,
  options?: ProvenanceVmOptions,
): GraphViewModel {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];

  const base: GraphViewModel = {
    nodes: nodes.map((n) => ({
      id: n.id,
      label: n.name,
      type: n.type,
      metadata: { ...(n.metadata ?? {}), referenceId: n.referenceId },
    })),
    edges: edges.map((e) => ({
      source: e.fromNodeId,
      target: e.toNodeId,
      type: e.type,
    })),
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };

  if (options?.buyerFacingLabels === true) {
    return applyBuyerLabelsToProvenanceGraphViewModel(base);
  }

  return base;
}
