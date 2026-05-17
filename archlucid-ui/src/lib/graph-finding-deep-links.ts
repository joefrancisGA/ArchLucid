import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

/** Query param read by {@link GraphPageContent} to pre-select a node in buyer-trail graph presentation. */
export const GRAPH_NODE_FOCUS_QUERY_PARAM = "graphNodeId";

export function graphTrailHrefWithOptionalNode(runId: string, graphNodeId: string | null): string {
  const params = new URLSearchParams();
  params.set("runId", runId.trim());
  const nid = graphNodeId?.trim() ?? "";

  if (nid.length > 0) {
    params.set(GRAPH_NODE_FOCUS_QUERY_PARAM, nid);
  }

  return `/graph?${params.toString()}`;
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
  return `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}`;
}

export function graphFindingInspectHref(runId: string, findingId: string): string {
  return `${graphFindingDetailHref(runId, findingId)}/inspect`;
}
