import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { getFindingEvidenceTraceHref } from "@/lib/finding-evidence-navigation";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

/** Query param read by {@link GraphPageContent} to pre-select a node in buyer-trail graph presentation. */
export const GRAPH_NODE_FOCUS_QUERY_PARAM = "graphNodeId";

/** Shipped Evidence graph visualization modes (must match graph-page-helpers `GraphMode`). */
export const SHIPPED_EVIDENCE_GRAPH_MODES = [
  "provenance-full",
  "decision-subgraph",
  "node-neighborhood",
  "architecture",
] as const;

export type ShippedEvidenceGraphMode = (typeof SHIPPED_EVIDENCE_GRAPH_MODES)[number];

/** Default graph mode when deep-linking from a finding (TB-1361). */
export const FINDING_EVIDENCE_GRAPH_DEFAULT_MODE: ShippedEvidenceGraphMode = "provenance-full";

export function graphTrailHrefWithOptionalNode(runId: string, graphNodeId: string | null): string {
  return getFindingEvidenceGraphHref(runId, graphNodeId);
}

/** Evidence graph href for a review — uses shipped `provenance-full` mode for finding jumps (TB-1361). */
export function getFindingEvidenceGraphHref(runId: string, graphNodeId?: string | null): string {
  const nid = graphNodeId?.trim() ?? "";

  return evidenceGraphHref({
    runId: runId.trim(),
    mode: FINDING_EVIDENCE_GRAPH_DEFAULT_MODE,
    ...(nid.length > 0 ? { [GRAPH_NODE_FOCUS_QUERY_PARAM]: nid } : {}),
  });
}

/**
 * Resolves a finding id from a graph node for deep links. Static demo nodes may omit `metadata.referenceId`
 * but still use stable internal ids (e.g. `n-phi`).
 */
export function findingIdForGraphDeepLink(node: GraphNodeVm): string | null {
  if (node.type !== "Finding") {
    return null;
  }

  const referenceId = node.metadata?.referenceId?.trim() ?? "";

  if (referenceId.length > 0) {
    return referenceId;
  }

  if (node.id.trim() === "n-phi") {
    return SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID;
  }

  return null;
}

export function graphFindingDetailHref(runId: string, findingId: string): string {
  return `/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`;
}

export function graphFindingInspectHref(runId: string, findingId: string): string {
  return getFindingEvidenceTraceHref(runId, findingId);
}
