import {
  deriveFindingTrustLabel,
  FINDING_PROVENANCE_ORIGIN_EXPLANATIONS,
  mapFindingTrustLabelToProvenance,
  type DeriveFindingTrustLabelInput,
  type FindingProvenanceGrounding,
  type FindingProvenanceOrigin,
  type FindingTrustLabelName,
} from "@/lib/finding-provenance-display";

export type FindingTrustChipKind =
  | "evidence-backed"
  | "citation-missing"
  | "low-confidence"
  | "simulator-derived"
  | "heuristic"
  | "deterministic-rule"
  | "deterministic-fallback"
  | "degraded";

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
  readonly origin: FindingProvenanceOrigin;
  readonly grounding: FindingProvenanceGrounding;
  readonly trustSource: "wire" | "inferred";
  readonly canonicalTrustLabel: FindingTrustLabelName;
};

export type FindingTrustExportPresentation = {
  readonly canonicalTrustLabel: FindingTrustLabelName;
  readonly exportLine: string | null;
  readonly jsonFields: { trustLabel: string; trustLabelReason?: string } | Record<string, never>;
};

export type FindingTrustPresentation = {
  readonly chipSet: FindingTrustChipSet;
  readonly inspectRow: FindingModelProvenanceRow;
  readonly export: FindingTrustExportPresentation;
};

function kindFromProvenance(
  origin: FindingProvenanceOrigin,
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

  if ((evidenceRefCount ?? 0) <= 0 && confidence === "Low") {
    return "heuristic";
  }

  return "citation-missing";
}

function buildInspectRow(
  input: FindingTrustPresentationInput,
  provenance: { readonly origin: FindingProvenanceOrigin; readonly grounding: FindingProvenanceGrounding },
): FindingModelProvenanceRow {
  const trustLabelReason =
    typeof input.trustLabelReason === "string" && input.trustLabelReason.trim().length > 0
      ? input.trustLabelReason.trim()
      : null;

  return {
    origin: provenance.origin,
    grounding: provenance.grounding,
    explanation: FINDING_PROVENANCE_ORIGIN_EXPLANATIONS[provenance.origin],
    trustLabelReason,
  };
}

function buildExportPresentation(
  input: FindingTrustPresentationInput,
  canonicalTrustLabel: FindingTrustLabelName,
): FindingTrustExportPresentation {
  const reason = input.trustLabelReason?.trim();
  const hasReason = reason !== undefined && reason.length > 0;
  const exportLine = hasReason
    ? `${canonicalTrustLabel} — ${reason}`
    : canonicalTrustLabel;

  const jsonFields = hasReason
    ? { trustLabel: canonicalTrustLabel, trustLabelReason: reason }
    : { trustLabel: canonicalTrustLabel };

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
  const provenance = mapFindingTrustLabelToProvenance(derived.label);

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
  const wireReason = input.trustLabelReason?.trim();

  const chipSet: FindingTrustChipSet = {
    kind,
    label: provenance.origin,
    groundingLabel: provenance.grounding,
    title:
      derived.source === "wire" && wireReason !== undefined && wireReason.length > 0
        ? wireReason
        : `${originExplanation}${groundingSuffix}`,
    origin: provenance.origin,
    grounding: provenance.grounding,
    trustSource: derived.source,
    canonicalTrustLabel: derived.label,
  };

  return {
    chipSet,
    inspectRow: buildInspectRow(input, provenance),
    export: buildExportPresentation(input, derived.label),
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
