import { fetchArchLucidJson } from "@/lib/api";
import { getRunSummary } from "@/lib/api/architecture-runs";
import { ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "@/lib/api/http";
import type { components } from "@/lib/openapi-schemas";
import type { GraphNodesPageResponse, GraphViewModel } from "@/types/graph";

/** Fetches the full provenance graph for a run (all decisions, findings, rules, artifacts). */
export async function getProvenanceGraph(runId: string): Promise<GraphViewModel> {
  return fetchArchLucidJson<GraphViewModel>(`/api/provenance/runs/${runId}/graph`);
}

/** Fetches the full architecture graph for a run (may return 413 when node count exceeds API limit). */
export async function getArchitectureGraph(runId: string): Promise<GraphViewModel> {
  return fetchArchLucidJson<GraphViewModel>(`/v1/graph/runs/${runId}`);
}

export type ArchitectureGraphTemporalSnapshot =
  components["schemas"]["ArchitectureGraphTemporalSnapshotResponse"];

/** Resolves the stored architecture graph as-of a UTC instant for the anchor review’s project lineage. */
export async function getArchitectureGraphTemporalSnapshot(
  anchorRunId: string,
  asOfIsoUtc: string,
): Promise<ArchitectureGraphTemporalSnapshot> {
  const rid = anchorRunId.trim();
  const path = `/v1/graph/snapshot?runId=${encodeURIComponent(rid)}&asOf=${encodeURIComponent(asOfIsoUtc)}`;

  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(path);
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
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  return fetchArchLucidJson<GraphNodesPageResponse>(`/v1/graph/runs/${runId}/nodes?${q.toString()}`);
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

  for (;;) {
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
  return fetchArchLucidJson<GraphViewModel>(
    `/api/provenance/runs/${runId}/graph/decision/${key}`,
  );
}

/** Fetches a neighborhood subgraph around a specific node, up to the given depth. */
export async function getNodeNeighborhood(
  runId: string,
  nodeId: string,
  depth = 1,
): Promise<GraphViewModel> {
  return fetchArchLucidJson<GraphViewModel>(
    `/api/provenance/runs/${runId}/graph/node/${nodeId}?depth=${depth}`,
  );
}
