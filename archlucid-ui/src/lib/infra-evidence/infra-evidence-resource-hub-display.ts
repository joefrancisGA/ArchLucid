import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { DIAGRAM_INFRASTRUCTURE_MATCH_KINDS } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

/** Map diagram correspondence match kind + confidence to enterprise status tag kind. */
export function resolveDiagramCorrespondenceStatusKind(
  matchKind: string,
  confidenceBand: string,
): EnterpriseStatusKind {
  const normalizedMatch = matchKind.trim();
  const normalizedConfidence = confidenceBand.trim();

  if (
    normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.conflict
    || normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.diagramOnly
    || normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.infrastructureOnly
  ) {
    return "blocked";
  }

  if (
    normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.exact
    || normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.probable
  ) {
    if (
      normalizedConfidence === "InsufficientEvidence"
      || normalizedConfidence === "Possible"
    ) {
      return "needs-attention";
    }

    return "ready";
  }

  if (
    normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.possible
    || normalizedMatch === DIAGRAM_INFRASTRUCTURE_MATCH_KINDS.unknown
  ) {
    return "needs-attention";
  }

  return "neutral";
}

/** Operator label for diagram correspondence confidence bands (UU-480). */
export function formatDiagramCorrespondenceConfidenceBandLabel(confidenceBand: string | null | undefined): string {
  const normalized = (confidenceBand ?? "").trim();

  if (normalized.length === 0) {
    return "Confidence not recorded";
  }

  const known = new Set(["Confirmed", "Likely", "Possible", "InsufficientEvidence"]);

  if (known.has(normalized)) {
    return normalized;
  }

  return normalized;
}

/** Confidence band tag kind for diagram correspondence rows. */
export function resolveDiagramCorrespondenceConfidenceStatusKind(confidenceBand: string): EnterpriseStatusKind {
  const normalized = confidenceBand.trim();

  if (normalized.length === 0) {
    return "neutral";
  }

  if (normalized === "Confirmed" || normalized === "Likely") {
    return "ready";
  }

  if (normalized === "Possible" || normalized === "InsufficientEvidence") {
    return "needs-attention";
  }

  return "neutral";
}

/** Map remediation instance lifecycle status strings to enterprise status tag kinds. */
export function remediationInstanceStatusTagKind(status: string): EnterpriseStatusKind {
  const normalized = status.trim().toLowerCase();

  if (normalized.includes("block") || normalized.includes("fail")) {
    return "blocked";
  }

  if (normalized.includes("verified") || normalized.includes("approved")) {
    return "approved";
  }

  if (
    normalized.includes("execut")
    || normalized.includes("preflight")
    || normalized.includes("classified")
    || normalized.includes("wave")
  ) {
    return "in-progress";
  }

  if (normalized.includes("closed")) {
    return "neutral";
  }

  if (normalized.includes("draft")) {
    return "draft";
  }

  return "neutral";
}

export function formatResourceHubFindingStreamCaption(
  visibleCount: number,
  totalCount: number,
  hasMore: boolean,
): string | null {
  if (!hasMore || totalCount <= visibleCount) {
    return null;
  }

  return `Showing ${visibleCount} of ${totalCount}`;
}
