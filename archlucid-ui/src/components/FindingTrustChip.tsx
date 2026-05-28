"use client";

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
  "evidence-backed":
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  "citation-missing":
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  "low-confidence":
    "border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100",
  "simulator-derived":
    "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
  heuristic:
    "border-neutral-300 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
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
