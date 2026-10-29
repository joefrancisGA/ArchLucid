import type { RunDetailPageModel } from "./run-detail-page-model";
import { isReviewFindingDispositionClosed } from "@/lib/findings/finding-job-view";
import {
  humanReviewStatusDisplay,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-summary-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { FindingSeverityCounts } from "@/lib/run-detail-workspace-derive";
import { deriveRunDetailFindingsTriageCounts } from "@/lib/runs/run-detail-findings-triage-counts";
import {
  countEngineFailureAdvisoryWithheldRows,
  describeFindingsWithheldListLoadState,
  resolveFindingsWithheldRows,
  type WithheldFindingRow,
} from "@/lib/findings/findings-withheld-band";

export function countPendingDecisions(findings: readonly QuickDecisionFinding[]): number {
  return findings.filter((finding) => {
    if (finding.isMuted || isReviewFindingDispositionClosed(finding)) {
      return false;
    }

    return humanReviewStatusDisplay(finding.humanReviewStatus)?.label === "Pending review";
  }).length;
}

export type RunDetailFindingsPresentation = {
  readonly quickDecisionFindings: readonly QuickDecisionFinding[];
  readonly findingsTriageVisibleCount: number;
  readonly severityCounts: FindingSeverityCounts;
  readonly materialSeverityLine: string | null;
  readonly pendingDecisionCount: number;
  readonly primaryConcernFindingId: string | null;
  readonly primaryConcernLabel: string | null;
  readonly blockingApprovalCount: number | null;
  readonly lowExtractionConfidenceCount: number;
  readonly withheldFindings: readonly WithheldFindingRow[];
  readonly withheldListLoadState: string | null;
  readonly catalogAdvisoryEngineFailureCount: number;
};

export function buildRunDetailFindingsPresentation(
  model: RunDetailPageModel,
  workspaceDerive: typeof import("@/lib/run-detail-workspace-derive"),
  coverageBlocking: boolean,
): RunDetailFindingsPresentation {
  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(
    model.resolvedDetail,
    model.explanationSummary,
  );
  const severityCounts = workspaceDerive.countFindingsBySeverity(
    workspaceDerive.filterUnresolvedFindings(quickDecisionFindings),
  );
  const blockingApprovalCount = workspaceDerive.deriveBlockingApprovalCount({
    unresolvedIssueCount: model.manifestSummary?.unresolvedIssueCount,
    hasCommitBlockingFailures: coverageBlocking,
    findings: quickDecisionFindings,
  });

  const withheldFindings = resolveFindingsWithheldRows(model.resolvedDetail);
  const withheldListLoadState = describeFindingsWithheldListLoadState(model.resolvedDetail);
  const unresolvedForSeverity = workspaceDerive.filterUnresolvedFindings(quickDecisionFindings);
  const materialSeverityTotal = severityCounts.critical + severityCounts.high;
  const materialSeverityLine =
    materialSeverityTotal > 0
      ? `${severityCounts.critical} critical · ${severityCounts.high} high`
      : unresolvedForSeverity.length > 0
          && unresolvedForSeverity.some((finding) => finding.severityValue === null)
        ? "Severity was not stored."
        : null;

  return {
    quickDecisionFindings,
    findingsTriageVisibleCount: deriveRunDetailFindingsTriageCounts(quickDecisionFindings).triageVisibleCount,
    severityCounts,
    materialSeverityLine,
    pendingDecisionCount: countPendingDecisions(quickDecisionFindings),
    primaryConcernFindingId: workspaceDerive.derivePrimaryConcernFinding(quickDecisionFindings)?.findingId ?? null,
    primaryConcernLabel: workspaceDerive.derivePrimaryConcernLabel(quickDecisionFindings),
    blockingApprovalCount,
    lowExtractionConfidenceCount: quickDecisionFindings.filter(
      (finding) =>
        !finding.isMuted &&
        !isReviewFindingDispositionClosed(finding) &&
        finding.severityValue !== null &&
        finding.severityValue >= 2 &&
        finding.confidenceLevel === "Low",
    ).length,
    withheldFindings,
    withheldListLoadState,
    catalogAdvisoryEngineFailureCount: countEngineFailureAdvisoryWithheldRows(withheldFindings),
  };
}
