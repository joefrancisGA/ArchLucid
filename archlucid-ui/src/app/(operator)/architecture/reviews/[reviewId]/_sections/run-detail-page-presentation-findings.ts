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
  readonly blockingApprovalCount: number;
  readonly lowExtractionConfidenceCount: number;
  readonly withheldFindings: readonly WithheldFindingRow[];
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

  return {
    quickDecisionFindings,
    findingsTriageVisibleCount: deriveRunDetailFindingsTriageCounts(quickDecisionFindings).triageVisibleCount,
    severityCounts,
    materialSeverityLine:
      severityCounts.critical + severityCounts.high > 0
        ? `${severityCounts.critical} critical · ${severityCounts.high} high`
        : null,
    pendingDecisionCount: countPendingDecisions(quickDecisionFindings),
    primaryConcernFindingId: workspaceDerive.derivePrimaryConcernFinding(quickDecisionFindings)?.findingId ?? null,
    primaryConcernLabel: workspaceDerive.derivePrimaryConcernLabel(quickDecisionFindings),
    blockingApprovalCount,
    lowExtractionConfidenceCount: quickDecisionFindings.filter(
      (finding) =>
        !finding.isMuted &&
        !isReviewFindingDispositionClosed(finding) &&
        finding.severityValue >= 2 &&
        finding.confidenceLevel === "Low",
    ).length,
    withheldFindings,
    catalogAdvisoryEngineFailureCount: countEngineFailureAdvisoryWithheldRows(withheldFindings),
  };
}
