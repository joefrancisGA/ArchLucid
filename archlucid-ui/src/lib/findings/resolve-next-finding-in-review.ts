import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { applyFindingsConfidenceVisibility } from "@/lib/findings/finding-confidence-filter";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import {
  extractQuickDecisionFindingsFromRunDetail,
  sortQuickDecisionFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import type { RunDetail } from "@/types/authority";

export type FindingDetailNextFindingTarget = {
  readonly findingId: string;
  readonly title: string;
  readonly href: string;
};

function triageVisibleFindings(
  findings: readonly QuickDecisionFinding[],
): readonly QuickDecisionFinding[] {
  const nonMuted = findings.filter(
    (finding) => !finding.isMuted && !isReviewFindingDispositionClosed(finding),
  );
  const { visibleFindings } = applyFindingsConfidenceVisibility(nonMuted, false);

  return visibleFindings;
}

/** Next finding in review triage order after the current finding id. */
export function resolveNextFindingInReview(
  findings: readonly QuickDecisionFinding[],
  currentFindingId: string,
): QuickDecisionFinding | null {
  const normalizedCurrentId = currentFindingId.trim();

  if (normalizedCurrentId.length === 0) {
    return null;
  }

  const sorted = sortQuickDecisionFindings(triageVisibleFindings(findings));
  const currentIndex = sorted.findIndex((finding) => finding.findingId === normalizedCurrentId);

  if (currentIndex < 0) {
    return null;
  }

  return sorted[currentIndex + 1] ?? null;
}

export function resolveNextFindingInReviewForRunDetail(
  runDetail: RunDetail,
  currentFindingId: string,
): FindingDetailNextFindingTarget | null {
  const findings = extractQuickDecisionFindingsFromRunDetail(runDetail);
  const nextFinding = resolveNextFindingInReview(findings, currentFindingId);

  if (nextFinding === null) {
    return null;
  }

  return {
    findingId: nextFinding.findingId,
    title: nextFinding.title,
    href: getFindingEvidenceTraceHref(runDetail.runId, nextFinding.findingId),
  };
}
