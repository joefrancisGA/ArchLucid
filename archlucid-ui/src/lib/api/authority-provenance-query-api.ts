import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { authorityProvenanceAliasBlockedReason } from "@/lib/graph/authority-provenance-alias-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { GraphViewModel } from "@/types/graph";

import { encodeRequiredPathSegment, positiveIntegerOrDefault } from "./api-boundary-normalization";

/** The API default neighbourhood depth. The server clamps anything below it back up to this value. */
const DEFAULT_NEIGHBORHOOD_DEPTH = 1;

function authorityRunPath(runId: string): string {
  return `/v1/authority/runs/${encodeRequiredPathSegment(runId, "runId")}`;
}

/** Reads an authority provenance route and maps a failure to its blocked reason. */
async function getAuthorityProvenance<T>(path: string): Promise<T> {
  try {
    return await apiGetSealedManifestAware<T>(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = authorityProvenanceAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Authority-route alias for persisted provenance snapshot metadata. */
export async function getAuthorityProvenanceSnapshot(runId: string): Promise<unknown> {
  return getAuthorityProvenance<unknown>(`${authorityRunPath(runId)}/provenance-snapshot`);
}

/** Authority-route alias for the full provenance graph. */
export async function getAuthorityProvenanceGraph(runId: string): Promise<GraphViewModel> {
  return getAuthorityProvenance<GraphViewModel>(`${authorityRunPath(runId)}/graph`);
}

/** Authority-route alias for a decision-rooted provenance subgraph. */
export async function getAuthorityProvenanceDecisionGraph(
  runId: string,
  decisionKey: string,
): Promise<GraphViewModel> {
  return getAuthorityProvenance<GraphViewModel>(
    `${authorityRunPath(runId)}/graph/decision/${encodeRequiredPathSegment(decisionKey, "decisionKey")}`,
  );
}

/** Authority-route alias for a node neighbourhood subgraph. */
export async function getAuthorityProvenanceNodeNeighborhood(
  runId: string,
  nodeId: string,
  depth = DEFAULT_NEIGHBORHOOD_DEPTH,
): Promise<GraphViewModel> {
  const safeDepth = positiveIntegerOrDefault(depth, DEFAULT_NEIGHBORHOOD_DEPTH);
  const query = safeDepth === DEFAULT_NEIGHBORHOOD_DEPTH ? "" : `?depth=${safeDepth}`;

  return getAuthorityProvenance<GraphViewModel>(
    `${authorityRunPath(runId)}/graph/node/${encodeRequiredPathSegment(nodeId, "nodeId")}${query}`,
  );
}
