import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import type { GraphViewModel } from "@/types/graph";

/** Authority-route alias for persisted provenance snapshot metadata. */
export async function getAuthorityProvenanceSnapshot(runId: string): Promise<unknown> {
  return apiGetSealedManifestAware<unknown>(`/v1/authority/runs/${encodeURIComponent(runId)}/provenance-snapshot`);
}

/** Authority-route alias for the full provenance graph. */
export async function getAuthorityProvenanceGraph(runId: string): Promise<GraphViewModel> {
  return apiGetSealedManifestAware<GraphViewModel>(`/v1/authority/runs/${encodeURIComponent(runId)}/graph`);
}

/** Authority-route alias for a decision-rooted provenance subgraph. */
export async function getAuthorityProvenanceDecisionGraph(
  runId: string,
  decisionKey: string,
): Promise<GraphViewModel> {
  return apiGetSealedManifestAware<GraphViewModel>(
    `/v1/authority/runs/${encodeURIComponent(runId)}/graph/decision/${encodeURIComponent(decisionKey)}`,
  );
}

/** Authority-route alias for a node neighbourhood subgraph. */
export async function getAuthorityProvenanceNodeNeighborhood(
  runId: string,
  nodeId: string,
  depth = 1,
): Promise<GraphViewModel> {
  const query = depth === 1 ? "" : `?depth=${encodeURIComponent(String(depth))}`;

  return apiGetSealedManifestAware<GraphViewModel>(
    `/v1/authority/runs/${encodeURIComponent(runId)}/graph/node/${encodeURIComponent(nodeId)}${query}`,
  );
}
