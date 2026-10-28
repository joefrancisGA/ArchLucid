import type { EnterpriseStatusKind } from "@/lib/design-tokens";

const PATH_CONFIDENCE_BAND_LABELS: Readonly<Record<string, string>> = {
  Confirmed: "Confirmed",
  HighlyLikely: "Highly likely",
  Probable: "Probable",
  Possible: "Possible",
  InsufficientEvidence: "Insufficient evidence",
};

const PROVENANCE_KIND_LABELS: Readonly<Record<string, string>> = {
  ObservedFact: "Observed fact",
  DerivedFact: "Derived fact",
  DeterministicInference: "Deterministic inference",
  AiInference: "AI inference",
  HumanAssertion: "Human assertion",
};

const PATH_KIND_LABELS: Readonly<Record<string, string>> = {
  IntendedReachability: "Can reach",
  Privilege: "Privilege",
  CapabilityToFlow: "May access",
};

export function formatSecurityEvidencePathKindLabel(kind: string | null | undefined): string {
  if (kind === null || kind === undefined) {
    return "Path kind was not stored.";
  }

  const trimmed = kind.trim();

  if (trimmed.length === 0) {
    return "Path kind was stored empty.";
  }

  const mapped = PATH_KIND_LABELS[trimmed];

  if (mapped !== undefined) {
    return mapped;
  }

  return "Path kind was not recognized.";
}

export function formatSecurityEvidencePathConfidenceBandLabel(band: string | null | undefined): string {
  const trimmed = band?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Confidence band was not stored.";
  }

  return PATH_CONFIDENCE_BAND_LABELS[trimmed] ?? "Confidence band was not recognized.";
}

export function formatSecurityEvidenceProvenanceKindLabel(kind: string | null | undefined): string {
  const trimmed = kind?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Provenance kind was not stored.";
  }

  return PROVENANCE_KIND_LABELS[trimmed] ?? "Provenance kind was not recognized.";
}

const PATH_RELATIONSHIP_LABELS: Readonly<Record<string, string>> = {
  CAN_READ: "Role allows read. This is not observed use.",
  CAN_WRITE: "Role allows write. This is not observed use.",
  USES_IDENTITY: "Identity is assigned. Use of that identity was not stored.",
  MEMBER_OF: "Group membership was stored. Observed use of that membership was not stored.",
  PossibleMovement: "Possible movement. An observed move was not stored.",
  UnrestrictedEgress: "unrestricted egress (declared NSG allow)",
  InsufficientEvidenceEgress: "egress not fully verified",
  SharedControlFanOut: "shared control fan-out",
  PublicNetworkAccess: "public network exposure",
};

export function formatSecurityEvidencePathRelationshipLabel(edgeType: string | null | undefined): string {
  const trimmed = edgeType?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Relationship type was not stored";
  }

  const mapped = PATH_RELATIONSHIP_LABELS[trimmed];

  if (mapped !== undefined) {
    return mapped;
  }

  return `Relationship type ${trimmed} has no reviewer label.`;
}

const PROVENANCE_KIND_MEANINGS: Readonly<Record<string, string>> = {
  ObservedFact: "This hop was read from collected evidence.",
  DerivedFact: "This hop was calculated from collected evidence.",
  DeterministicInference: "A fixed rule produced this hop.",
  AiInference: "A model proposed this hop. It is not an observed fact.",
  HumanAssertion: "A person recorded this hop.",
};

export function explainSecurityEvidenceProvenanceKind(kind: string | null | undefined): string | null {
  const trimmed = kind?.trim() ?? "";
  return PROVENANCE_KIND_MEANINGS[trimmed] ?? null;
}

export function securityEvidencePathConfidenceBandStatusKind(
  band: string | null | undefined,
): EnterpriseStatusKind {
  const trimmed = band?.trim() ?? "";

  if (trimmed === "Confirmed" || trimmed === "HighlyLikely") {
    return "ready";
  }

  if (trimmed === "Probable") {
    return "in-progress";
  }

  if (trimmed === "Possible" || trimmed === "InsufficientEvidence") {
    return "needs-attention";
  }

  return "neutral";
}
