import type { GraphViewModel } from "@/types/graph";

/** Known coordinator provenance node kinds surfaced on the review-trail graph. */
export const PROVENANCE_TRAIL_NODE_TYPES: ReadonlySet<string> = new Set([
  "ArchitectureRun",
  "ContextSnapshot",
  "GraphSnapshot",
  "FindingsSnapshot",
  "GoldenManifest",
  "ArtifactBundle",
]);

/** Buyer-facing labels for internal provenance node types (avoid leaking data-model names). */
export const PROVENANCE_TYPE_BUSINESS_LABEL: Readonly<Record<string, string>> = {
  ArchitectureRun: "Review started",
  ContextSnapshot: "Context captured",
  GraphSnapshot: "Evidence graph created",
  FindingsSnapshot: "Findings captured",
  GoldenManifest: "Manifest finalized",
  ArtifactBundle: "Artifacts bundled",
};

export function isProvenanceTrailCoordinatorType(nodeType: string): boolean {
  return PROVENANCE_TRAIL_NODE_TYPES.has(nodeType);
}

/** Map a single node's label for buyer-facing provenance graphs. */
export function buyerLabelForProvenanceNode(nodeType: string, fallbackName: string): string {
  const mapped = PROVENANCE_TYPE_BUSINESS_LABEL[nodeType];

  if (mapped !== undefined && mapped.length > 0) {
    return mapped;
  }

  return fallbackName;
}

/** Rewrite node labels so the canvas never leads with raw coordinator type names. */
export function applyBuyerLabelsToProvenanceGraphViewModel(graph: GraphViewModel): GraphViewModel {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => ({
      ...n,
      label: buyerLabelForProvenanceNode(n.type, n.label),
    })),
  };
}
