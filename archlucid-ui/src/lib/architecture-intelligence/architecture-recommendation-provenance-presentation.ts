export type ArchitectureRecommendationClaimOrigin =
  | "DirectlyExtracted"
  | "UserAsserted"
  | "ModelInferred"
  | "ExternallySourced"
  | "SystemProposed"
  | "HumanApproved";

export type ArchitectureRecommendationProvenance = {
  readonly origin?: ArchitectureRecommendationClaimOrigin;
  readonly supportStatus?: string;
  readonly confidence?: number;
  readonly notes?: string | null;
};

const ORIGIN_LABELS: Record<ArchitectureRecommendationClaimOrigin, string> = {
  DirectlyExtracted: "Directly extracted",
  UserAsserted: "User asserted",
  ModelInferred: "Model proposed",
  ExternallySourced: "Externally sourced",
  SystemProposed: "System proposed",
  HumanApproved: "Human approved",
};

export function formatArchitectureRecommendationOriginLabel(
  origin: ArchitectureRecommendationClaimOrigin | undefined,
): string | null {
  if (origin === undefined) {
    return null;
  }

  return ORIGIN_LABELS[origin] ?? origin;
}

export function formatArchitectureRecommendationProvenanceLine(
  provenance: ArchitectureRecommendationProvenance | null | undefined,
): string | null {
  if (provenance === null || provenance === undefined) {
    return null;
  }

  const originLabel = formatArchitectureRecommendationOriginLabel(provenance.origin);

  if (originLabel === null) {
    return null;
  }

  const supportStatus = provenance.supportStatus?.trim() ?? "";

  if (supportStatus.length === 0) {
    return `Origin: ${originLabel}`;
  }

  return `Origin: ${originLabel} · Support: ${supportStatus}`;
}

export function isArchitectureRecommendationEvidenceBacked(
  provenance: ArchitectureRecommendationProvenance | null | undefined,
): boolean {
  if (provenance === null || provenance === undefined) {
    return false;
  }

  if (provenance.origin === "ModelInferred") {
    return provenance.supportStatus === "DirectlyEstablished";
  }

  return provenance.supportStatus === "DirectlyEstablished"
    || provenance.supportStatus === "IndirectlySupported"
    || provenance.supportStatus === "PartiallySupported";
}
