import { buildReviewWorkspaceRouteHref } from "@/lib/architecture/review-workspace-route";
import { extractArchitectureIdentityIdFromPathname } from "@/lib/desk-continuity-preference";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  getFindingDetailHref,
  getFindingEvidenceTraceHref,
} from "@/lib/findings/finding-evidence-navigation";
import { readRecentPrimaryReviewDeskTarget } from "@/lib/reviews/review-pin-run-url";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

export type ResolveGraphReviewDeskArchitectureIdOptions = {
  readonly pathname?: string | null;
  readonly search?: string | null;
  readonly architectureId?: string | null;
};

/** AO-33 — evidence graph deep links stay on the Working nested desk when continuity is known. */
export function resolveGraphReviewDeskArchitectureId(
  runId: string,
  options?: ResolveGraphReviewDeskArchitectureIdOptions,
): string | null {
  const explicitArchitectureId = options?.architectureId?.trim() ?? "";

  if (explicitArchitectureId.length > 0) {
    return explicitArchitectureId;
  }

  const fromPath = extractArchitectureIdentityIdFromPathname(options?.pathname ?? "", options?.search ?? "");

  if (fromPath !== null) {
    return fromPath;
  }

  const recent = readRecentPrimaryReviewDeskTarget();
  const trimmedRunId = runId.trim();

  if (recent !== null && recent.primaryRunId === trimmedRunId) {
    return recent.architectureId;
  }

  return null;
}

export const GRAPH_RUN_EXPLANATION_HASH = "#run-explanation";

export function graphReviewRunExplanationHref(runId: string, architectureId?: string | null): string {
  return buildReviewWorkspaceRouteHref({
    runId,
    architectureId,
    hash: GRAPH_RUN_EXPLANATION_HASH,
  });
}

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

export function graphFindingDetailHref(
  runId: string,
  findingId: string,
  architectureId?: string | null,
): string {
  return getFindingDetailHref(runId, findingId, { architectureId });
}

export function graphFindingInspectHref(
  runId: string,
  findingId: string,
  architectureId?: string | null,
): string {
  return getFindingEvidenceTraceHref(runId, findingId, { architectureId });
}
