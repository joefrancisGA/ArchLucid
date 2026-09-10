import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { authorityProvenanceAliasBlockedReason } from "@/lib/graph/authority-provenance-alias-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { GraphViewModel } from "@/types/graph";

/** Authority-route alias for persisted provenance snapshot metadata. */
export async function getAuthorityProvenanceSnapshot(runId: string): Promise<unknown> {
  try {
    return await apiGetSealedManifestAware<unknown>(
      `/v1/authority/runs/${encodeURIComponent(runId)}/provenance-snapshot`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = authorityProvenanceAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Authority-route alias for the full provenance graph. */
export async function getAuthorityProvenanceGraph(runId: string): Promise<GraphViewModel> {
  try {
    return await apiGetSealedManifestAware<GraphViewModel>(`/v1/authority/runs/${encodeURIComponent(runId)}/graph`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = authorityProvenanceAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Authority-route alias for a decision-rooted provenance subgraph. */
export async function getAuthorityProvenanceDecisionGraph(
  runId: string,
  decisionKey: string,
): Promise<GraphViewModel> {
  try {
    return await apiGetSealedManifestAware<GraphViewModel>(
      `/v1/authority/runs/${encodeURIComponent(runId)}/graph/decision/${encodeURIComponent(decisionKey)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = authorityProvenanceAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Authority-route alias for a node neighbourhood subgraph. */
export async function getAuthorityProvenanceNodeNeighborhood(
  runId: string,
  nodeId: string,
  depth = 1,
): Promise<GraphViewModel> {
  const query = depth === 1 ? "" : `?depth=${encodeURIComponent(String(depth))}`;

  try {
    return await apiGetSealedManifestAware<GraphViewModel>(
      `/v1/authority/runs/${encodeURIComponent(runId)}/graph/node/${encodeURIComponent(nodeId)}${query}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = authorityProvenanceAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
