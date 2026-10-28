import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  isDecisionGradeFinding,
} from "@/lib/findings/review-detail-findings-classification-band";
import {
  FINDING_SEMANTIC_SUPPORT_BAND_NOT_STORED_COPY,
  normalizeFindingSemanticSupportBand,
  resolveDecisionGradeSemanticSupportBand,
} from "@/lib/findings/semantic-support-band-presentation";
import {
  shouldPresentSemanticSupportBandAsRehearsal,
  SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL,
} from "@/lib/governance/simulator-career-honesty";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export type SemanticSupportBandStampCounts = {
  readonly supported: number;
  readonly unchecked: number;
  readonly unsupported: number;
  readonly notScored: number;
  readonly missingStoredBand: number;
  readonly storedEmptyBand: number;
  readonly decisionGradeTotal: number;
};

export const FINDING_SEMANTIC_SUPPORT_BAND_STORED_EMPTY_COPY =
  "Semantic support band was stored empty." as const;

export function countDecisionGradeSemanticSupportBands(
  findings: readonly QuickDecisionFinding[],
): SemanticSupportBandStampCounts {
  let supported = 0;
  let unchecked = 0;
  let unsupported = 0;
  let notScored = 0;
  let missingStoredBand = 0;
  let storedEmptyBand = 0;
  let decisionGradeTotal = 0;

  for (const finding of findings) {
    if (!isDecisionGradeFinding(finding)) {
      continue;
    }

    decisionGradeTotal += 1;
    const rawBand: unknown = finding.semanticSupportBand;

    if (rawBand === null || rawBand === undefined) {
      missingStoredBand += 1;
      continue;
    }

    if (rawBand === "") {
      storedEmptyBand += 1;
      continue;
    }

    const band = normalizeFindingSemanticSupportBand(rawBand);

    if (band === null) {
      continue;
    }

    if (band === "Supported") {
      supported += 1;
      continue;
    }

    if (band === "Unchecked") {
      unchecked += 1;
      continue;
    }

    if (band === "Unsupported") {
      unsupported += 1;
      continue;
    }

    notScored += 1;
  }

  return {
    supported,
    unchecked,
    unsupported,
    notScored,
    missingStoredBand,
    storedEmptyBand,
    decisionGradeTotal,
  };
}

export function stampSemanticSupportShowsAllClear(counts: SemanticSupportBandStampCounts): boolean {
  return (
    counts.decisionGradeTotal > 0
    && counts.unsupported === 0
    && counts.unchecked === 0
    && counts.missingStoredBand === 0
    && counts.storedEmptyBand === 0
    && counts.notScored === 0
  );
}

function formatBandCountSegment(label: string, count: number): string {
  return `${count} ${label}`;
}

export function countDecisionGradeSemanticSupportBandsForPresentation(
  findings: readonly QuickDecisionFinding[],
  structuralExecutionMode?: StructuralExecutionModeInput,
): SemanticSupportBandStampCounts {
  if (!shouldPresentSemanticSupportBandAsRehearsal(structuralExecutionMode)) {
    return countDecisionGradeSemanticSupportBands(findings);
  }

  let decisionGradeTotal = 0;

  for (const finding of findings) {
    if (!isDecisionGradeFinding(finding)) {
      continue;
    }

    decisionGradeTotal += 1;
  }

  return {
    supported: 0,
    unchecked: 0,
    unsupported: 0,
    notScored: decisionGradeTotal,
    missingStoredBand: 0,
    storedEmptyBand: 0,
    decisionGradeTotal,
  };
}

export function formatStampSemanticSupportBandLineForPresentation(
  counts: SemanticSupportBandStampCounts,
  structuralExecutionMode?: StructuralExecutionModeInput,
  options?: { readonly compact?: boolean },
): string | null {
  if (shouldPresentSemanticSupportBandAsRehearsal(structuralExecutionMode)) {
    if (counts.decisionGradeTotal === 0) {
      return null;
    }

    const prefix =
      options?.compact === true ? "Semantic support:" : "Semantic support (decision-grade):";

    return `${prefix} ${SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL}`;
  }

  return formatStampSemanticSupportBandLine(counts, options);
}

export function listUnsupportedDecisionGradeSemanticSupportFindingsForPresentation(
  findings: readonly QuickDecisionFinding[],
  structuralExecutionMode?: StructuralExecutionModeInput,
): UnsupportedSemanticSupportStampEntry[] {
  if (shouldPresentSemanticSupportBandAsRehearsal(structuralExecutionMode)) {
    return [];
  }

  return listUnsupportedDecisionGradeSemanticSupportFindings(findings);
}

export function stampSemanticSupportShowsAllClearForPresentation(
  counts: SemanticSupportBandStampCounts,
  structuralExecutionMode?: StructuralExecutionModeInput,
): boolean {
  if (shouldPresentSemanticSupportBandAsRehearsal(structuralExecutionMode)) {
    return false;
  }

  return stampSemanticSupportShowsAllClear(counts);
}

export function formatStampSemanticSupportBandLine(
  counts: SemanticSupportBandStampCounts,
  options?: { readonly compact?: boolean },
): string | null {
  if (counts.decisionGradeTotal === 0) {
    return null;
  }

  const segments = [
    formatBandCountSegment("Supported", counts.supported),
    formatBandCountSegment("Unchecked", counts.unchecked),
    formatBandCountSegment("Unsupported", counts.unsupported),
  ];

  if (options?.compact !== true && counts.notScored > 0) {
    segments.push(formatBandCountSegment("Not scored", counts.notScored));
  }

  if (counts.missingStoredBand > 0) {
    segments.push(FINDING_SEMANTIC_SUPPORT_BAND_NOT_STORED_COPY);
  }

  if (counts.storedEmptyBand > 0) {
    segments.push(FINDING_SEMANTIC_SUPPORT_BAND_STORED_EMPTY_COPY);
  }

  const prefix = options?.compact === true ? "Semantic support:" : "Semantic support (decision-grade):";

  return `${prefix} ${segments.join(" · ")}`;
}

export type UnsupportedSemanticSupportStampEntry = {
  readonly findingId: string;
  readonly title: string;
};

export function listUnsupportedDecisionGradeSemanticSupportFindings(
  findings: readonly QuickDecisionFinding[],
): UnsupportedSemanticSupportStampEntry[] {
  const entries: UnsupportedSemanticSupportStampEntry[] = [];

  for (const finding of findings) {
    if (!isDecisionGradeFinding(finding)) {
      continue;
    }

    const band = resolveDecisionGradeSemanticSupportBand(finding.semanticSupportBand);

    if (band !== "Unsupported") {
      continue;
    }

    entries.push({
      findingId: finding.findingId,
      title:
        finding.title.trim().length > 0 ? finding.title.trim() : "Finding title was not stored.",
    });
  }

  return entries;
}

export function formatStampUnsupportedSemanticSupportLabels(
  entries: readonly UnsupportedSemanticSupportStampEntry[],
): string[] {
  return entries.map((entry) => `Finding id: ${entry.findingId} — ${entry.title}`);
}
