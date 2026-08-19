"use client";

import { cn } from "@/lib/utils";
import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  deriveFindingTrustPresentation,
  type FindingTrustChipKind,
  type FindingTrustChipSet,
  type FindingTrustPresentationInput,
} from "@/lib/findings/finding-trust-presentation";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type { FindingTrustChipKind, FindingTrustChipSet };

/** @deprecated Use FindingTrustChipSet — kept for existing imports. */
export type FindingTrustChipModel = FindingTrustChipSet;

const chipClassByKind: Record<FindingTrustChipKind, string> = {
  "evidence-backed": enterpriseStatusTagClass("ready"),
  "citation-missing": enterpriseStatusTagClass("needs-attention"),
  "low-confidence": enterpriseStatusTagClass("needs-attention"),
  "simulator-derived": enterpriseStatusTagClass("in-progress"),
  heuristic: enterpriseStatusTagClass("neutral"),
  "deterministic-rule": enterpriseStatusTagClass("ready"),
  "deterministic-fallback": enterpriseStatusTagClass("needs-attention"),
  degraded: enterpriseStatusTagClass("needs-attention"),
};

function toPresentationInput(
  finding: QuickDecisionFinding,
  options?: { readonly isSimulatorRun?: boolean },
): FindingTrustPresentationInput {
  return {
    trustLabel: finding.trustLabel,
    trustLabelReason: finding.trustLabelReason,
    policyRuleId: finding.policyRuleId,
    evidenceRefCount: finding.evidenceRefCount,
    confidenceLevel: finding.confidenceLevel,
    isSimulatorRun: options?.isSimulatorRun,
  };
}

/** Deterministic trust chip from existing wire fields — origin × grounding, no invented scores. */
export function deriveFindingTrustChip(
  finding: QuickDecisionFinding,
  options?: { readonly isSimulatorRun?: boolean },
): FindingTrustChipSet {
  return deriveFindingTrustPresentation(toPresentationInput(finding, options)).chipSet;
}

type FindingTrustChipProps = {
  readonly finding: QuickDecisionFinding;
  readonly isSimulatorRun?: boolean;
};

export function FindingTrustChip(props: FindingTrustChipProps) {
  const chip = deriveFindingTrustChip(props.finding, {
    isSimulatorRun: props.isSimulatorRun,
  });

  return <FindingTrustChipFromSet chipSet={chip} />;
}

type FindingTrustChipFromSetProps = {
  readonly chipSet: FindingTrustChipSet;
};

export function FindingTrustChipFromSet(props: FindingTrustChipFromSetProps) {
  const chip = props.chipSet;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold",
        chipClassByKind[chip.kind],
        OPERATOR_TYPOGRAPHY.helper,
      )}
      aria-label={chip.title}
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
