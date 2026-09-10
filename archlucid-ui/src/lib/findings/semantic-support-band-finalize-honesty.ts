import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import { countDecisionGradeSemanticSupportBands } from "@/lib/findings/semantic-support-band-stamp";

export const UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_TITLE =
  "Semantic support is not confirmed for some findings";

export const UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_LEAD =
  "Structural citations are present, but semantic support is not confirmed for every decision-grade row.";

export const UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_FOOTER =
  "Finalize stays enabled. Review Unchecked findings before sponsor send.";

export function countUncheckedDecisionGradeSemanticSupportBands(
  findings: readonly QuickDecisionFinding[],
): number {
  return countDecisionGradeSemanticSupportBands(findings).unchecked;
}

export function shouldShowUncheckedSemanticSupportFinalizeWarning(input: {
  readonly workingDesk: boolean;
  readonly manifestFinalized: boolean;
  readonly findings: readonly QuickDecisionFinding[];
}): boolean {
  if (!input.workingDesk || input.manifestFinalized) {
    return false;
  }

  return countUncheckedDecisionGradeSemanticSupportBands(input.findings) > 0;
}

export function formatUncheckedSemanticSupportFinalizeCopy(uncheckedCount: number): string {
  const countLabel =
    uncheckedCount === 1
      ? "1 decision-grade finding is Unchecked"
      : `${uncheckedCount} decision-grade findings are Unchecked`;

  return `${UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_LEAD} ${countLabel}. ${UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_FOOTER}`;
}
