import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  normalizeProvenanceNodeTypeKey,
  provenanceNodeNameBuyerLabel,
  provenanceNodeTypeBuyerLabel,
} from "@/lib/provenance-node-type-labels";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import type { GraphViewModel } from "@/types/graph";

/** Known coordinator provenance node kinds surfaced on the review-trail graph. */
export const PROVENANCE_TRAIL_NODE_TYPES: ReadonlySet<string> = new Set([
  "ArchitectureRun",
  "ContextSnapshot",
  "PolicyPack",
  "GraphSnapshot",
  "FindingsSnapshot",
  "GoldenManifest",
  "ArtifactBundle",
]);

/** Buyer-facing labels for internal provenance node types (avoid leaking data-model names). */
export const PROVENANCE_TYPE_BUSINESS_LABEL: Readonly<Record<string, string>> = {
  ArchitectureRun: "Review kickoff",
  ContextSnapshot: "Reviewed source context",
  GraphSnapshot: "Evidence graph",
  FindingsSnapshot: "Findings recorded",
  GoldenManifest: SIGNED_MANIFEST_LABEL,
  ArtifactBundle: "Deliverables packaged",
  run: "Review started",
  request: "Review request",
  goldenManifestPointer: SIGNED_MANIFEST_LABEL,
  manifestVersion: SIGNED_MANIFEST_LABEL,
  artifactBundle: "Deliverables packaged",
};

export function isProvenanceTrailCoordinatorType(nodeType: string): boolean {
  return PROVENANCE_TRAIL_NODE_TYPES.has(nodeType);
}

function isPhiMinimizationFindingLabel(label: string): boolean {
  const lower = label.toLowerCase();

  return lower.includes("phi") && (lower.includes("minimization") || lower.includes("minimisation"));
}

function resolveMappedBusinessLabel(nodeType: string): string | null {
  const direct = PROVENANCE_TYPE_BUSINESS_LABEL[nodeType];

  if (direct !== undefined && direct.length > 0) {
    return direct;
  }

  const normalized = normalizeProvenanceNodeTypeKey(nodeType);

  for (const [key, label] of Object.entries(PROVENANCE_TYPE_BUSINESS_LABEL)) {
    if (normalizeProvenanceNodeTypeKey(key) === normalized) {
      return label;
    }
  }

  return null;
}

/**
 * Types whose mapped label is a generic lifecycle placeholder. A persisted name on these nodes
 * is usually the reviewed system, which tells a buyer more than "Review request" does — so the
 * name wins here, while types mapped to canonical product terms keep their mapped label.
 */
const GENERIC_LIFECYCLE_TYPE_KEYS: ReadonlySet<string> = new Set(["request", "run"]);

/** Map a single node's label for buyer-facing provenance graphs. */
export function buyerLabelForProvenanceNode(nodeType: string, fallbackName: string): string {
  if (nodeType === "Finding" && isPhiMinimizationFindingLabel(fallbackName)) {
    return BUYER_SURFACE_VOCABULARY.phiMinimizationRisk;
  }

  if (GENERIC_LIFECYCLE_TYPE_KEYS.has(normalizeProvenanceNodeTypeKey(nodeType))) {
    return provenanceNodeNameBuyerLabel(nodeType, fallbackName);
  }

  const mapped = resolveMappedBusinessLabel(nodeType);

  if (mapped !== null) {
    return mapped;
  }

  return provenanceNodeNameBuyerLabel(nodeType, fallbackName);
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
