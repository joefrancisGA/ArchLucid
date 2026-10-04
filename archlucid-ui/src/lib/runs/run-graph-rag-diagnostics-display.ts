import type { RunRetrievalGroundingSummary } from "@/types/authority";

export const GRAPH_RAG_NEIGHBOR_HIT_RATE_HELPER =
  "Share of graph neighbor expansion that returned chunks — not citation coverage on the review." as const;

function finiteMetric(value: unknown): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numeric) ? numeric : null;
}

export function formatGraphRagDiagnosticCount(value: number | null | undefined): string {
  const finite = finiteMetric(value);

  if (finite === null) {
    return "Not returned";
  }

  return String(finite);
}

export function formatGraphRagNeighborHitRate(value: number | string | null | undefined): string {
  const finite = finiteMetric(value);

  if (finite === null) {
    return "Not returned";
  }

  const pct = finite > 0 && finite <= 1 ? Math.round(finite * 100) : Math.round(finite);

  return `${pct}%`;
}

export function formatGraphRagPilotFloorDisposition(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Not returned";
  }

  return trimmed.toUpperCase();
}

/** True when the summary includes any graph-RAG field (including explicit zeros). */
export function runGraphRagDiagnosticsStripHasSignal(summary: RunRetrievalGroundingSummary): boolean {
  return (
    summary.totalGraphRagNeighborsAdded !== undefined ||
    summary.totalGraphRagSeedHits !== undefined ||
    summary.totalRetrievalTokensIn !== undefined ||
    summary.graphRagNeighborHitRate !== undefined ||
    summary.graphRagPilotFloorDisposition !== undefined ||
    summary.graphRagQualityPosture !== undefined
  );
}
