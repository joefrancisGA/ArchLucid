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

export const ARCHITECTURE_RECOMMENDATION_PROVENANCE_NOT_STORED =
  "Provenance was not stored." as const;

export const ARCHITECTURE_RECOMMENDATION_SUPPORT_STATUS_NOT_STORED =
  "Support status was not stored." as const;

export function formatArchitectureRecommendationSupportStatusLabel(supportStatus: string): string {
  const trimmed = supportStatus.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  if (trimmed === "IndirectlySupported") {
    return "Indirect support (not evidence-backed)";
  }

  return trimmed;
}

export function formatArchitectureRecommendationProvenanceLine(
  provenance: ArchitectureRecommendationProvenance | null | undefined,
): string | null {
  if (provenance === null || provenance === undefined) {
    return ARCHITECTURE_RECOMMENDATION_PROVENANCE_NOT_STORED;
  }

  const originLabel = formatArchitectureRecommendationOriginLabel(provenance.origin);

  if (originLabel === null) {
    return ARCHITECTURE_RECOMMENDATION_PROVENANCE_NOT_STORED;
  }

  const supportStatus = provenance.supportStatus?.trim() ?? "";

  if (supportStatus.length === 0) {
    return `Origin: ${originLabel} · Support: ${ARCHITECTURE_RECOMMENDATION_SUPPORT_STATUS_NOT_STORED}`;
  }

  return `Origin: ${originLabel} · Support: ${formatArchitectureRecommendationSupportStatusLabel(supportStatus)}`;
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
    || provenance.supportStatus === "PartiallySupported";
}
