import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  isDecisionGradeFinding,
} from "@/lib/findings/review-detail-findings-classification-band";
import { resolveDecisionGradeSemanticSupportBand } from "@/lib/findings/semantic-support-band-presentation";
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
  readonly decisionGradeTotal: number;
};

export function countDecisionGradeSemanticSupportBands(
  findings: readonly QuickDecisionFinding[],
): SemanticSupportBandStampCounts {
  let supported = 0;
  let unchecked = 0;
  let unsupported = 0;
  let notScored = 0;
  let decisionGradeTotal = 0;

  for (const finding of findings) {
    if (!isDecisionGradeFinding(finding)) {
      continue;
    }

    decisionGradeTotal += 1;
    const band = resolveDecisionGradeSemanticSupportBand(finding.semanticSupportBand);

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
    decisionGradeTotal,
  };
}

export function stampSemanticSupportShowsAllClear(counts: SemanticSupportBandStampCounts): boolean {
  return counts.decisionGradeTotal > 0 && counts.unsupported === 0;
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
      title: finding.title.trim().length > 0 ? finding.title.trim() : finding.findingId,
    });
  }

  return entries;
}

export function formatStampUnsupportedSemanticSupportLabels(
  entries: readonly UnsupportedSemanticSupportStampEntry[],
): string[] {
  return entries.map((entry) => `${entry.findingId}: ${entry.title}`);
}
