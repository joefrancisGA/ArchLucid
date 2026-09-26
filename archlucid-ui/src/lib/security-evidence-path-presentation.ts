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
  const trimmed = kind?.trim() ?? "";

  if (trimmed.length === 0) {
    return "—";
  }

  return PATH_KIND_LABELS[trimmed] ?? trimmed;
}

export function formatSecurityEvidencePathConfidenceBandLabel(band: string | null | undefined): string {
  const trimmed = band?.trim() ?? "";

  if (trimmed.length === 0) {
    return "—";
  }

  return PATH_CONFIDENCE_BAND_LABELS[trimmed] ?? trimmed;
}

export function formatSecurityEvidenceProvenanceKindLabel(kind: string | null | undefined): string {
  const trimmed = kind?.trim() ?? "";

  if (trimmed.length === 0) {
    return "—";
  }

  return PROVENANCE_KIND_LABELS[trimmed] ?? trimmed;
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
