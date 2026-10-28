import type { InfraEvidenceMermaidFallbackArtifactSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

export const INFRA_EVIDENCE_MERMAID_FALLBACK_STATUS_NOT_STORED = "Fallback status was not stored.";
export const INFRA_EVIDENCE_MERMAID_FALLBACK_NODE_COUNT_NOT_STORED = "Node count was not stored.";
export const INFRA_EVIDENCE_MERMAID_FALLBACK_EDGE_COUNT_NOT_STORED = "Edge count was not stored.";
export const INFRA_EVIDENCE_MERMAID_RENDER_FAILURE_REASON_NOT_STORED = "Failure reason was not stored.";
export const INFRA_EVIDENCE_MERMAID_ALWAYS_EXCLUDED_REASON_NOT_STORED = "Exclusion reason was not stored.";

export function formatInfraEvidenceMermaidFallbackArtifactStatus(status: string | null): string {
  if (status === null) {
    return INFRA_EVIDENCE_MERMAID_FALLBACK_STATUS_NOT_STORED;
  }

  const trimmed = status.trim();

  return trimmed.length > 0 ? trimmed : INFRA_EVIDENCE_MERMAID_FALLBACK_STATUS_NOT_STORED;
}

function formatInfraEvidenceMermaidFallbackCount(
  value: number | null,
  notStoredLabel: string,
): string {
  if (value === null) {
    return notStoredLabel;
  }

  return String(value);
}

export function formatInfraEvidenceMermaidFallbackArtifactMetricsLine(
  artifact: Pick<InfraEvidenceMermaidFallbackArtifactSummary, "nodeCount" | "edgeCount" | "status">,
): string {
  const nodeLabel = formatInfraEvidenceMermaidFallbackCount(
    artifact.nodeCount,
    INFRA_EVIDENCE_MERMAID_FALLBACK_NODE_COUNT_NOT_STORED,
  );
  const edgeLabel = formatInfraEvidenceMermaidFallbackCount(
    artifact.edgeCount,
    INFRA_EVIDENCE_MERMAID_FALLBACK_EDGE_COUNT_NOT_STORED,
  );
  const statusLabel = formatInfraEvidenceMermaidFallbackArtifactStatus(artifact.status);

  return `${nodeLabel} nodes · ${edgeLabel} edges · ${statusLabel}`;
}

export function formatInfraEvidenceMermaidRenderFailureDescription(
  failureReason: string | null | undefined,
): string {
  if (failureReason === null || failureReason === undefined) {
    return INFRA_EVIDENCE_MERMAID_RENDER_FAILURE_REASON_NOT_STORED;
  }

  const trimmed = failureReason.trim();

  return trimmed.length > 0 ? trimmed : INFRA_EVIDENCE_MERMAID_RENDER_FAILURE_REASON_NOT_STORED;
}

export function formatInfraEvidenceMermaidAlwaysExcludedReason(
  exclusionReason: string | null | undefined,
): string {
  if (exclusionReason === null || exclusionReason === undefined) {
    return INFRA_EVIDENCE_MERMAID_ALWAYS_EXCLUDED_REASON_NOT_STORED;
  }

  const trimmed = exclusionReason.trim();

  return trimmed.length > 0 ? trimmed : INFRA_EVIDENCE_MERMAID_ALWAYS_EXCLUDED_REASON_NOT_STORED;
}
