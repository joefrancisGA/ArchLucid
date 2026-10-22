import type { GraphViewModel } from "@/types/graph";

/** Keeps only nodes of `typeFilter` and edges whose endpoints both remain (matches {@link GraphViewer} behavior). */
export function graphViewModelFilteredByNodeType(graph: GraphViewModel, typeFilter: string): GraphViewModel {
  const tf = typeFilter.trim();

  if (tf.length === 0) {
    return graph;
  }

  const nodes = graph.nodes.filter((n) => n.type === tf);
  const ids = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));

  return { nodes, edges };
}
