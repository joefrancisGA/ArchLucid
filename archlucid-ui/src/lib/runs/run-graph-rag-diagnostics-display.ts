import {
  formatRetrievalGroundingCount,
  formatRetrievalGroundingRatioPercent,
} from "@/lib/runs/run-retrieval-grounding-summary-display";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

export const GRAPH_RAG_NEIGHBOR_HIT_RATE_SCOPE_LINE =
  "Neighbor chunks with a citation link ÷ neighbor chunks added on this run (not the citation-coverage percent above)." as const;

export const GRAPH_RAG_REVIEW_RETRIEVAL_SCOPE_LINE =
  "Metrics describe this review’s retrieval pass only — not tenant-wide search quality." as const;

export function resolveGraphRagPilotFloorLabel(
  disposition: string | null | undefined,
): string {
  const trimmed = disposition?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Pilot floor not returned";
  }

  return trimmed.toUpperCase();
}

export function summaryHasGraphRagDiagnosticFields(summary: RunRetrievalGroundingSummary): boolean {
  return (
    summary.totalGraphRagNeighborsAdded !== undefined
    || summary.totalGraphRagSeedHits !== undefined
    || summary.graphRagNeighborHitRate !== undefined
    || summary.totalRetrievalTokensIn !== undefined
    || summary.graphRagPilotFloorDisposition !== undefined
    || summary.graphRagQualityPosture !== undefined
  );
}

export function shouldRenderGraphRagDiagnosticsStrip(summary: RunRetrievalGroundingSummary): boolean {
  if (summaryHasGraphRagDiagnosticFields(summary)) {
    return true;
  }

  const neighbors = summary.totalGraphRagNeighborsAdded;
  const seeds = summary.totalGraphRagSeedHits;
  const tokensIn = summary.totalRetrievalTokensIn;

  return (
    (typeof neighbors === "number" && neighbors > 0)
    || (typeof seeds === "number" && seeds > 0)
    || (typeof tokensIn === "number" && tokensIn > 0)
  );
}

export function formatGraphRagNeighborHitRateDisplay(summary: RunRetrievalGroundingSummary): string {
  return formatRetrievalGroundingRatioPercent(summary.graphRagNeighborHitRate);
}

export function formatGraphRagCountField(value: number | null | undefined): string {
  return formatRetrievalGroundingCount(value);
}
