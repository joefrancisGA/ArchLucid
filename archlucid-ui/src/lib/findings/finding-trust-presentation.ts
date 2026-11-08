import {
  deriveFindingTrustLabel,
  FINDING_PROVENANCE_ORIGIN_EXPLANATIONS,
  mapFindingTrustLabelToProvenance,
  resolveFindingProvenance,
  type DeriveFindingTrustLabelInput,
  type FindingProvenanceGrounding,
  type FindingProvenanceOriginDisplay,
  type FindingTrustPresentationLabel,
} from "@/lib/findings/finding-provenance-display";

export const FINDING_TRUST_LABEL_REASON_NOT_STORED = "Trust label reason was not stored." as const;

export type FindingTrustChipKind =
  | "evidence-backed"
  | "citation-missing"
  | "low-confidence"
  | "simulator-derived"
  | "heuristic"
  | "deterministic-rule"
  | "deterministic-fallback"
  | "degraded"
  | "trust-label-not-stored";

/** Shared input for inspect, compare-delta chips, and export footers (TB-2135). */
export type FindingTrustPresentationInput = DeriveFindingTrustLabelInput & {
  readonly trustLabelReason?: string | null;
};

export type FindingModelProvenanceRow = {
  readonly origin: string;
  readonly grounding: string;
  readonly explanation: string;
  readonly trustLabelReason: string | null;
};

export type FindingTrustChipSet = {
  readonly kind: FindingTrustChipKind;
  /** Origin axis — primary badge label. */
  readonly label: string;
  /** Grounding axis — secondary text / tooltip detail. */
  readonly groundingLabel: string;
  readonly title: string;
  readonly origin: FindingProvenanceOriginDisplay;
  readonly grounding: FindingProvenanceGrounding;
  readonly trustSource: "wire" | "inferred" | "not-stored";
  readonly canonicalTrustLabel: FindingTrustPresentationLabel;
};

export type FindingTrustExportPresentation = {
  readonly canonicalTrustLabel: FindingTrustPresentationLabel;
  readonly exportLine: string | null;
  readonly jsonFields: { trustLabel: string; trustLabelReason?: string } | Record<string, never>;
};

export type FindingTrustPresentation = {
  readonly chipSet: FindingTrustChipSet;
  readonly inspectRow: FindingModelProvenanceRow;
  readonly export: FindingTrustExportPresentation;
};

function kindFromProvenance(
  origin: FindingProvenanceOriginDisplay,
  grounding: FindingProvenanceGrounding,
): FindingTrustChipKind {
  if (origin === "Deterministic rule") {
    return "deterministic-rule";
  }

  if (origin === "Deterministic fallback") {
    return "deterministic-fallback";
  }

  if (origin === "Simulated") {
    return "simulator-derived";
  }

  if (origin === "Heuristic" || origin === "MissingCitation") {
    return origin === "Heuristic" ? "heuristic" : "citation-missing";
  }

  if (origin === "RealModel") {
    return "trust-label-not-stored";
  }

  if (origin === "Trust label was not stored") {
    return "trust-label-not-stored";
  }

  switch (grounding) {
    case "Evidence-backed":
      return "evidence-backed";
    case "Estimated":
      return "low-confidence";
    case "Ungrounded":
      return "citation-missing";
    case "Degraded":
      return "degraded";
    case "Not applicable":
      return "heuristic";
    case "Grounding was not stored.":
      return "trust-label-not-stored";
    default: {
      const exhaustive: never = grounding;

      return exhaustive;
    }
  }
}

function refineUngroundedKind(
  grounding: FindingProvenanceGrounding,
  evidenceRefCount: number | null | undefined,
  confidence: string | null | undefined,
): FindingTrustChipKind {
  if (grounding !== "Ungrounded") {
    return "heuristic";
  }

  if (evidenceRefCount === null || evidenceRefCount === undefined) {
    return "heuristic";
  }

  if (evidenceRefCount <= 0 && confidence === "Low") {
    return "heuristic";
  }

  return "citation-missing";
}

function wireTrustLabelReasonStoredOnWire(input: FindingTrustPresentationInput): string | null {
  if (typeof input.trustLabelReason !== "string") {
    return null;
  }

  const trimmed = input.trustLabelReason.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function resolveWireTrustLabelReasonForInspect(input: FindingTrustPresentationInput): string | null {
  if (typeof input.trustLabel !== "string" || input.trustLabel.trim().length === 0) {
    return null;
  }

  const stored = wireTrustLabelReasonStoredOnWire(input);

  if (stored !== null) {
    return stored;
  }

  return FINDING_TRUST_LABEL_REASON_NOT_STORED;
}

function buildInspectRow(
  input: FindingTrustPresentationInput,
  provenance: { readonly origin: FindingProvenanceOriginDisplay; readonly grounding: FindingProvenanceGrounding },
): FindingModelProvenanceRow {
  const derived = deriveFindingTrustLabel(input);
  const trustLabelReason =
    derived.source === "wire" ? resolveWireTrustLabelReasonForInspect(input) : null;

  return {
    origin: provenance.origin,
    grounding: provenance.grounding,
    explanation: FINDING_PROVENANCE_ORIGIN_EXPLANATIONS[provenance.origin],
    trustLabelReason,
  };
}

function buildExportPresentation(
  input: FindingTrustPresentationInput,
  canonicalTrustLabel: FindingTrustPresentationLabel,
  derivedSource: "wire" | "inferred" | "not-stored",
): FindingTrustExportPresentation {
  const reason =
    derivedSource === "wire"
      ? wireTrustLabelReasonStoredOnWire(input)
      : input.trustLabelReason?.trim() ?? null;
  const hasReason = reason !== null && reason.length > 0;
  const exportLabel = canonicalTrustLabel === "NotStored"
    ? "Trust label was not stored."
    : canonicalTrustLabel;
  const exportLine = hasReason
    ? `${exportLabel} — ${reason}`
    : exportLabel;

  const jsonFields: FindingTrustExportPresentation["jsonFields"] = hasReason
    ? { trustLabel: exportLabel, trustLabelReason: reason }
    : { trustLabel: exportLabel };

  return {
    canonicalTrustLabel,
    exportLine,
    jsonFields,
  };
}

/** Single trust-label presentation contract for inspect, compare delta, and export footers. */
export function deriveFindingTrustPresentation(
  input: FindingTrustPresentationInput,
): FindingTrustPresentation {
  const derived = deriveFindingTrustLabel(input);
  const provenance = resolveFindingProvenance(input);

  let kind = kindFromProvenance(provenance.origin, provenance.grounding);

  if (provenance.origin === "AI-generated" && provenance.grounding === "Ungrounded") {
    kind = refineUngroundedKind(
      provenance.grounding,
      input.evidenceRefCount,
      input.confidenceLevel,
    );
  }

  const originExplanation = FINDING_PROVENANCE_ORIGIN_EXPLANATIONS[provenance.origin];
  const groundingSuffix =
    provenance.grounding === "Not applicable"
      ? ""
      : ` Grounding: ${provenance.grounding}.`;
  const wireReason = derived.source === "wire" ? resolveWireTrustLabelReasonForInspect(input) : null;

  const chipSet: FindingTrustChipSet = {
    kind,
    label: provenance.origin,
    groundingLabel: provenance.grounding,
    title:
      wireReason ?? `${originExplanation}${groundingSuffix}`,
    origin: provenance.origin,
    grounding: provenance.grounding,
    trustSource: derived.source,
    canonicalTrustLabel: derived.label,
  };

  return {
    chipSet,
    inspectRow: buildInspectRow(input, provenance),
    export: buildExportPresentation(input, derived.label, derived.source),
  };
}

/** Compare-delta rows reuse the same origin × grounding chip set as inspect (TB-2135). */
export function formatFindingTrustCompareDeltaLabels(
  chipSet: FindingTrustChipSet,
): { readonly origin: string; readonly grounding: string } {
  return {
    origin: chipSet.origin,
    grounding: chipSet.grounding,
  };
}
