import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export const GRAPH_NEIGHBORHOOD_DEPTH_PARAM = "depth";

export const DEFAULT_GRAPH_NEIGHBORHOOD_DEPTH = 1;

const MIN_GRAPH_NEIGHBORHOOD_DEPTH = 0;
const MAX_GRAPH_NEIGHBORHOOD_DEPTH = 10;

export function parseGraphNeighborhoodDepthFromSearch(raw: string | null | undefined): number {
  if (raw === null || raw === undefined) {
    return DEFAULT_GRAPH_NEIGHBORHOOD_DEPTH;
  }

  const trimmed = raw.trim();
  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < MIN_GRAPH_NEIGHBORHOOD_DEPTH || parsed > MAX_GRAPH_NEIGHBORHOOD_DEPTH) {
    return DEFAULT_GRAPH_NEIGHBORHOOD_DEPTH;
  }

  return Math.floor(parsed);
}

export function graphNeighborhoodDepthHrefFromSearch(
  currentSearch: string,
  depth: number,
  pathname: string = EVIDENCE_GRAPH_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const clamped = Math.min(MAX_GRAPH_NEIGHBORHOOD_DEPTH, Math.max(MIN_GRAPH_NEIGHBORHOOD_DEPTH, Math.floor(depth)));

  if (clamped === DEFAULT_GRAPH_NEIGHBORHOOD_DEPTH) {
    params.delete(GRAPH_NEIGHBORHOOD_DEPTH_PARAM);
  } else {
    params.set(GRAPH_NEIGHBORHOOD_DEPTH_PARAM, String(clamped));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
