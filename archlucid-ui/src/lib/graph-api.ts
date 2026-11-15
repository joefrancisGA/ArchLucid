import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { getRunSummary } from "@/lib/api/architecture-runs";
import { architectureGraphReadBlockedReason, architectureGraphTemporalSnapshotBlockedReason } from "@/lib/graph/architecture-graph-temporal-snapshot-blocked-reason";
import { provenanceGraphAliasBlockedReason } from "@/lib/graph/provenance-graph-alias-blocked-reason";
import { isApiRequestError } from "@/lib/api-request-error";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGet, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "@/lib/api/http";
import type { components } from "@/lib/openapi-schemas";
import type { GraphNodesPageResponse, GraphViewModel } from "@/types/graph";

/** Fetches the full provenance graph for a run (all decisions, findings, rules, artifacts). */
export async function getProvenanceGraph(runId: string): Promise<GraphViewModel> {
  try {
    return await apiGetSealedManifestAware<GraphViewModel>(`/v1/provenance/runs/${encodeURIComponent(runId)}/graph`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = provenanceGraphAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Fetches the full architecture graph for a run (may return 413 when node count exceeds API limit). */
export async function getArchitectureGraph(runId: string): Promise<GraphViewModel> {
  try {
    return await apiGet<GraphViewModel>(`/v1/evidence-graph/reviews/${runId}`);
  } catch (error: unknown) {
    if (isApiRequestError(error) && error.httpStatus === 413) {
      throw error;
    }

    const failure = toApiLoadFailure(error);
    const blockedReason = architectureGraphReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export type ArchitectureGraphTemporalSnapshot =
  components["schemas"]["ArchitectureGraphTemporalSnapshotResponse"];

/** Resolves the stored architecture graph as-of a UTC instant for the anchor review’s project lineage. */
export async function getArchitectureGraphTemporalSnapshot(
  anchorRunId: string,
  asOfIsoUtc: string,
): Promise<ArchitectureGraphTemporalSnapshot> {
  try {
    const rid = anchorRunId.trim();
    const path = `/v1/evidence-graph/snapshot?runId=${encodeURIComponent(rid)}&asOf=${encodeURIComponent(asOfIsoUtc)}`;

    await ensureOidcBearerReady();
    const { url, headers } = await resolveRequest(path);
    const fetchHeaders = withCorrelationHeaders(headers);
    const response = await fetch(url, {
      cache: "no-store",
      headers: fetchHeaders,
    });
    const text = await response.text();

    if (response.status === 413) {
      const resolvedId: string | null = tryReadResolvedRunIdFromProblemJson(text);

      if (resolvedId !== null) {
        const merged = await mergeArchitectureGraphPages(resolvedId);
        const summary = await getRunSummary(resolvedId);

        return {
          resolvedRunId: resolvedId,
          asOfUtc: asOfIsoUtc,
          resolvedRunCreatedUtc: summary.createdUtc,
          graph: merged,
        };
      }
    }

    if (!response.ok) {
      throwApiRequestError(response, text);
    }

    return JSON.parse(text) as ArchitectureGraphTemporalSnapshot;
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureGraphTemporalSnapshotBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

function tryReadResolvedRunIdFromProblemJson(bodyText: string): string | null {
  const trimmed = bodyText.trim();

  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const fromRoot = record.resolvedRunId;

    if (typeof fromRoot === "string") {
      const id = fromRoot.trim();

      if (id.length > 0) {
        return id;
      }
    }

    const extRaw = record.extensions;

    if (extRaw !== null && extRaw !== undefined && typeof extRaw === "object" && !Array.isArray(extRaw)) {
      const ext = extRaw as Record<string, unknown>;
      const fromExt = ext.resolvedRunId;

      if (typeof fromExt === "string") {
        const id = fromExt.trim();

        if (id.length > 0) {
          return id;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** One page of architecture graph nodes (+ edges whose endpoints are both on the page). */
export async function getArchitectureGraphPage(
  runId: string,
  page = 1,
  pageSize = 200,
): Promise<GraphNodesPageResponse> {
  const normalizedRunId = runId.trim();
  const normalizedPage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 200;
  const q = new URLSearchParams({
    page: String(normalizedPage),
    pageSize: String(normalizedPageSize),
  });

  try {
    return await apiGetSealedManifestAware<GraphNodesPageResponse>(
      `/v1/evidence-graph/reviews/${encodeURIComponent(normalizedRunId)}/nodes?${q.toString()}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureGraphReadBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/**
 * Loads every paginated slice and merges nodes/edges (deduped). Use when GET full graph returns 413.
 * Cross-page edges (endpoint on different pages) are not present in any slice — see API docs / problem hint.
 */
export async function mergeArchitectureGraphPages(
  runId: string,
  pageSize = 200,
): Promise<GraphViewModel> {
  const nodes: GraphViewModel["nodes"] = [];
  const edges: GraphViewModel["edges"] = [];
  const seenNode = new Set<string>();
  const seenEdge = new Set<string>();
  let page = 1;

  const maximumPages = 1000;

  for (;;) {
    if (page > maximumPages) {
      throw new Error("Architecture graph pagination did not converge.");
    }

    const slice = await getArchitectureGraphPage(runId, page, pageSize);

    for (const n of slice.nodes) {
      if (!seenNode.has(n.id)) {
        seenNode.add(n.id);
        nodes.push(n);
      }
    }

    for (const e of slice.edges) {
      const k = `${e.source}|${e.target}|${e.type}`;

      if (!seenEdge.has(k)) {
        seenEdge.add(k);
        edges.push(e);
      }
    }

    if (!slice.hasMore) {
      break;
    }

    page++;
  }

  return { nodes, edges, nodeCount: nodes.length, edgeCount: edges.length };
}

/** Fetches the subgraph centered on a specific decision node. */
export async function getDecisionSubgraph(
  runId: string,
  decisionId: string,
): Promise<GraphViewModel> {
  const key = encodeURIComponent(decisionId);

  try {
    return await apiGetSealedManifestAware<GraphViewModel>(
      `/v1/provenance/runs/${encodeURIComponent(runId)}/graph/decision/${key}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = provenanceGraphAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Fetches a neighborhood subgraph around a specific node, up to the given depth. */
export async function getNodeNeighborhood(
  runId: string,
  nodeId: string,
  depth = 1,
): Promise<GraphViewModel> {
  const normalizedDepth = Number.isFinite(depth) && depth >= 0 ? Math.floor(depth) : 1;

  try {
    return await apiGetSealedManifestAware<GraphViewModel>(
      `/v1/provenance/runs/${encodeURIComponent(runId.trim())}/graph/node/${encodeURIComponent(nodeId.trim())}?depth=${normalizedDepth}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = provenanceGraphAliasBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export {
  architectureGraphReadBlockedReason,
  architectureGraphTemporalSnapshotBlockedReason,
} from "@/lib/graph/architecture-graph-temporal-snapshot-blocked-reason";
