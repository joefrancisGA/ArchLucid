"use client";

import { enterpriseStatusTagClass } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type FindingTrustChipKind =
  | "evidence-backed"
  | "citation-missing"
  | "low-confidence"
  | "simulator-derived"
  | "heuristic";

export type FindingTrustChipModel = {
  kind: FindingTrustChipKind;
  label: string;
  title: string;
};

const chipClassByKind: Record<FindingTrustChipKind, string> = {
  "evidence-backed": enterpriseStatusTagClass("ready"),
  "citation-missing": enterpriseStatusTagClass("needs-attention"),
  "low-confidence": enterpriseStatusTagClass("needs-attention"),
  "simulator-derived": enterpriseStatusTagClass("in-progress"),
  heuristic: enterpriseStatusTagClass("neutral"),
};

/** Deterministic trust chip from existing wire fields — no invented confidence scores. */
export function deriveFindingTrustChip(finding: QuickDecisionFinding): FindingTrustChipModel {
  const evidenceCount = finding.evidenceRefCount ?? 0;
  const confidence = finding.confidenceLevel ?? null;

  if (evidenceCount <= 0) {
    if (confidence === "Low") {
      return {
        kind: "heuristic",
        label: "Heuristic",
        title: "No evidence references; agent applied heuristic reasoning.",
      };
    }

    return {
      kind: "citation-missing",
      label: "Citation missing",
      title: "No evidence references are attached to this finding.",
    };
  }

  if (confidence === "Low") {
    return {
      kind: "low-confidence",
      label: "Low confidence",
      title: "Evidence exists but evaluation confidence is low.",
    };
  }

  return {
    kind: "evidence-backed",
    label: "Evidence-backed",
    title: "At least one evidence reference supports this finding.",
  };
}

type FindingTrustChipProps = {
  readonly finding: QuickDecisionFinding;
};

export function FindingTrustChip(props: FindingTrustChipProps) {
  const chip = deriveFindingTrustChip(props.finding);

  return (
    <span
      className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${chipClassByKind[chip.kind]}`}
      title={chip.title}
      data-testid={`finding-trust-chip-${chip.kind}`}
    >
      {chip.label}
    </span>
  );
}
