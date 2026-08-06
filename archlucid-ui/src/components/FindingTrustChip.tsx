"use client";

import { cn } from "@/lib/utils";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  deriveFindingTrustLabel,
  FINDING_PROVENANCE_ORIGIN_EXPLANATIONS,
  mapFindingTrustLabelToProvenance,
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
  | "degraded";

export type FindingTrustChipModel = {
  kind: FindingTrustChipKind;
  /** Origin axis — primary badge label. */
  label: string;
  /** Grounding axis — secondary text / tooltip detail. */
  groundingLabel: string;
  title: string;
  origin: FindingProvenanceOrigin;
  grounding: FindingProvenanceGrounding;
  trustSource: "wire" | "inferred";
};

const chipClassByKind: Record<FindingTrustChipKind, string> = {
  "evidence-backed": enterpriseStatusTagClass("ready"),
  "citation-missing": enterpriseStatusTagClass("needs-attention"),
  "low-confidence": enterpriseStatusTagClass("needs-attention"),
  "simulator-derived": enterpriseStatusTagClass("in-progress"),
  heuristic: enterpriseStatusTagClass("neutral"),
  "deterministic-rule": enterpriseStatusTagClass("ready"),
  degraded: enterpriseStatusTagClass("needs-attention"),
};

function kindFromProvenance(
  origin: FindingProvenanceOrigin,
  grounding: FindingProvenanceGrounding,
): FindingTrustChipKind {
  if (origin === "Deterministic rule") {
    return "deterministic-rule";
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

/** Deterministic trust chip from existing wire fields — origin × grounding, no invented scores. */
export function deriveFindingTrustChip(
  finding: QuickDecisionFinding,
  options?: { readonly isSimulatorRun?: boolean },
): FindingTrustChipModel {
  const derived = deriveFindingTrustLabel({
    trustLabel: finding.trustLabel,
    policyRuleId: finding.policyRuleId,
    evidenceRefCount: finding.evidenceRefCount,
    confidenceLevel: finding.confidenceLevel,
    isSimulatorRun: options?.isSimulatorRun,
  });

  const provenance = mapFindingTrustLabelToProvenance(derived.label as FindingTrustLabelName);

  let kind = kindFromProvenance(provenance.origin, provenance.grounding);

  if (provenance.origin === "AI-generated" && provenance.grounding === "Ungrounded") {
    kind = refineUngroundedKind(
      provenance.grounding,
      finding.evidenceRefCount,
      finding.confidenceLevel,
    );
  }

  const originExplanation = FINDING_PROVENANCE_ORIGIN_EXPLANATIONS[provenance.origin];
  const groundingSuffix =
    provenance.grounding === "Not applicable"
      ? ""
      : ` Grounding: ${provenance.grounding}.`;

  return {
    kind,
    label: provenance.origin,
    groundingLabel: provenance.grounding,
    title: `${originExplanation}${groundingSuffix}`,
    origin: provenance.origin,
    grounding: provenance.grounding,
    trustSource: derived.source,
  };
}

type FindingTrustChipProps = {
  readonly finding: QuickDecisionFinding;
  readonly isSimulatorRun?: boolean;
};

export function FindingTrustChip(props: FindingTrustChipProps) {
  const chip = deriveFindingTrustChip(props.finding, {
    isSimulatorRun: props.isSimulatorRun,
  });

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold",
        chipClassByKind[chip.kind],
        OPERATOR_TYPOGRAPHY.helper,
      )}
      title={chip.title}
      data-testid={`finding-trust-chip-${chip.kind}`}
      data-finding-origin={chip.origin}
      data-finding-grounding={chip.grounding}
      data-trust-source={chip.trustSource}
    >
      <span>{chip.label}</span>
      {chip.grounding !== "Not applicable" ? (
        <span className="font-normal opacity-80">{chip.grounding}</span>
      ) : null}
    </span>
  );
}
