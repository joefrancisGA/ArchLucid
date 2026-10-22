import type { InfraEvidenceMermaidComplexityMetrics } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

/** Mirrors server IE-17 readability thresholds — browser must not render above these. */
export const INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS = {
  maxNodes: 400,
  maxEdges: 800,
  maxSubgraphs: 64,
  maxMaxDegree: 48,
  maxCrossSubgraphEdges: 200,
  maxTextSizeBytes: 512_000,
  maxLayoutEstimate: 250_000,
} as const;

export const INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE =
  "Graph too large for browser rendering. Download the server-rendered PNG instead.";

export function exceedsInfraEvidenceMermaidClientGuard(
  metrics: InfraEvidenceMermaidComplexityMetrics | null | undefined,
): boolean {
  if (metrics == null) {
    return false;
  }

  const thresholds = INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS;

  return (
    metrics.nodeCount > thresholds.maxNodes
    || metrics.edgeCount > thresholds.maxEdges
    || metrics.subgraphCount > thresholds.maxSubgraphs
    || metrics.maxDegree > thresholds.maxMaxDegree
    || metrics.crossSubgraphEdgeCount > thresholds.maxCrossSubgraphEdges
    || metrics.textSizeBytes > thresholds.maxTextSizeBytes
    || metrics.layoutEstimate > thresholds.maxLayoutEstimate
  );
}
