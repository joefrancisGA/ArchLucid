import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import { governanceGateLabelFromManifestStatus } from "@/lib/governance-gate-display";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { shouldShowRunDetailGovernanceCta } from "@/lib/run-detail-governance-cta-visibility";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import type { ManifestSummary, RunDetail, RunSummary } from "@/types/authority";

export type RunDetailWorkspaceStatusKind =
  | "draft"
  | "analysis-in-progress"
  | "review-complete"
  | "awaiting-decision"
  | "changes-requested"
  | "approved"
  | "finalized";

export type RunDetailWorkspaceStatus = {
  readonly label: string;
  readonly kind: RunDetailWorkspaceStatusKind;
  readonly statusTagKind: EnterpriseStatusKind;
};

export type FindingSeverityCounts = {
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
};

export type RunDetailWorkspaceRecommendedAction = {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly relatedFindingCount: number | null;
  readonly ownerOrRole: string | null;
  readonly href: string;
  readonly actionLabel: string;
};

export type ExecutiveBottomLineContent =
  | {
      readonly kind: "narrative";
      readonly text: string;
    }
  | {
      readonly kind: "considerations";
      readonly themes: readonly string[];
    };

export type DeriveRunDetailWorkspaceStatusInput = {
  readonly run: RunDetail["run"];
  readonly manifestId: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly showProgressTracker: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly buyerPolishedArtifactTable: boolean;
};

export function countFindingsBySeverity(findings: readonly QuickDecisionFinding[]): FindingSeverityCounts {
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    if (finding.severityValue >= 3) {
      critical += 1;
    } else if (finding.severityValue === 2) {
      high += 1;
    } else if (finding.severityValue === 1) {
      medium += 1;
    } else {
      low += 1;
    }
  }

  return { critical, high, medium, low };
}

export function deriveHighestFindingSeverityLabel(
  findings: readonly QuickDecisionFinding[],
  fallback: string | null,
): string | null {
  const counts = countFindingsBySeverity(findings);
  const total = counts.critical + counts.high + counts.medium + counts.low;

  if (total === 0) {
    return fallback;
  }

  if (counts.critical > 0) {
    return "Critical";
  }

  if (counts.high > 0) {
    return "High";
  }

  if (counts.medium > 0) {
    return "Medium";
  }

  return "Low";
}

export function deriveArchitectureSystemName(run: RunSummary, headline: string): string | null {
  const displayName = run.displayName?.trim() ?? "";

  if (displayName.length > 0 && displayName !== headline) {
    return displayName;
  }

  const description = run.description?.trim() ?? "";
  const runId = run.runId?.trim() ?? "";

  if (
    description.length > 0 &&
    description !== headline &&
    description !== runId &&
    description.toLowerCase() !== runId.toLowerCase()
  ) {
    const firstLine = description.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? description;

    if (firstLine.length <= 120) {
      return firstLine;
    }

    return `${firstLine.slice(0, 117)}…`;
  }

  return null;
}

export function deriveSubmittedArchitectureText(run: RunSummary, headline: string): string | null {
  const description = run.description?.trim() ?? "";
  const runId = run.runId?.trim() ?? "";

  if (description.length === 0) {
    return null;
  }

  if (description === runId || description.toLowerCase() === runId.toLowerCase()) {
    return null;
  }

  if (description === headline) {
    return null;
  }

  return description;
}

export function deriveReviewOwnerLabel(run: RunDetail["run"]): string | null {
  const decisionBy = run.operatorGovernanceDecisionByUserId?.trim() ?? "";

  if (decisionBy.length > 0) {
    return decisionBy;
  }

  return null;
}

export function deriveReviewTemplateLabel(
  manifestSummary: ManifestSummary | null,
): string | null {
  if (manifestSummary === null) {
    return null;
  }

  const label = policyPackBuyerLabel(manifestSummary.ruleSetId, manifestSummary.ruleSetVersion).trim();

  return label.length > 0 ? label : null;
}

export function deriveLastEvaluatedLabel(
  run: RunDetail["run"],
  manifestSummary: ManifestSummary | null,
): string | null {
  const completedUtc = run.completedUtc?.trim() ?? "";

  if (completedUtc.length > 0) {
    return completedUtc;
  }

  const manifestUtc = manifestSummary?.createdUtc?.trim() ?? "";

  if (manifestUtc.length > 0) {
    return manifestUtc;
  }

  return run.createdUtc;
}

export function deriveRunDetailWorkspaceStatus(input: DeriveRunDetailWorkspaceStatusInput): RunDetailWorkspaceStatus {
  const manifestId = (input.manifestId ?? "").trim();
  const governanceDecision = (input.operatorGovernanceDecision ?? "").trim();
  const manifestStatus = manifestStatusForDisplay(input.manifestStatus);
  const gateLabel = governanceGateLabelFromManifestStatus(input.manifestStatus);
  const pipelineLabel = deriveRunListPipelineLabel(input.run as RunSummary);

  if (manifestId.length > 0) {
    if (/reject/i.test(governanceDecision) || gateLabel === "Failed") {
      return { label: "Changes requested", kind: "changes-requested", statusTagKind: "needs-attention" };
    }

    if (
      shouldShowRunDetailGovernanceCta({
        manifestId,
        buyerPolishedArtifactTable: input.buyerPolishedArtifactTable,
        operatorGovernanceDecision: input.operatorGovernanceDecision,
        manifestStatus: input.manifestStatus,
      })
    ) {
      return { label: "Awaiting decision", kind: "awaiting-decision", statusTagKind: "needs-attention" };
    }

    if (/approv/i.test(governanceDecision) || gateLabel === "Passed") {
      return { label: "Approved", kind: "approved", statusTagKind: "approved" };
    }

    if (manifestStatus === "Finalized" || pipelineLabel === PIPELINE_STATUS_LABELS.finalized) {
      return { label: "Finalized", kind: "finalized", statusTagKind: "ready" };
    }

    return { label: "Review complete", kind: "review-complete", statusTagKind: "ready" };
  }

  if (input.showProgressTracker) {
    return { label: "Analysis in progress", kind: "analysis-in-progress", statusTagKind: "in-progress" };
  }

  if (runAnalysisComplete(input.run)) {
    return { label: "Review complete", kind: "review-complete", statusTagKind: "ready" };
  }

  return { label: "Draft", kind: "draft", statusTagKind: "neutral" };
}

function runAnalysisComplete(run: RunDetail["run"]): boolean {
  const completedUtc = run.completedUtc?.trim() ?? "";

  if (completedUtc.length > 0) {
    return true;
  }

  const legacyStatus = run.legacyRunStatus?.trim() ?? "";

  return legacyStatus === "Completed";
}

export function deriveBlockingApprovalCount(input: {
  readonly unresolvedIssueCount: number | null | undefined;
  readonly hasCommitBlockingFailures: boolean;
  readonly findings: readonly QuickDecisionFinding[];
}): number {
  if (typeof input.unresolvedIssueCount === "number" && Number.isFinite(input.unresolvedIssueCount)) {
    const n = Math.trunc(input.unresolvedIssueCount);

    if (n > 0) {
      return n;
    }
  }

  if (input.hasCommitBlockingFailures) {
    return input.findings.filter((finding) => !finding.isMuted && finding.enforcementTier !== "Advisory").length;
  }

  return 0;
}

export function deriveRecommendedWorkspaceActions(input: {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly manifestId: string | null | undefined;
  readonly showProgressTracker: boolean;
  readonly hasCommitBlockingFailures: boolean;
  readonly blockingFindingCount: number;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly runCompleted: boolean;
  readonly evidenceCoverageComplete?: boolean;
}): RunDetailWorkspaceRecommendedAction[] {
  const actions: RunDetailWorkspaceRecommendedAction[] = [];
  const severityCounts = countFindingsBySeverity(input.findings);
  const unassignedHigh = input.findings.filter(
    (finding) =>
      !finding.isMuted &&
      finding.severityValue >= 2 &&
      (finding.assignedToUserId?.trim() ?? "").length === 0,
  ).length;
  const pendingDecision = input.findings.filter((finding) => {
    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    return status?.label === "Pending review";
  }).length;
  const evidenceGaps = input.findings.filter((finding) => (finding.evidenceRefCount ?? 0) === 0).length;

  if (input.showProgressTracker) {
    actions.push({
      id: "continue-analysis",
      title: "Continue analysis",
      reason: "Pipeline stages are still running for this review.",
      relatedFindingCount: null,
      ownerOrRole: "Review owner",
      href: buildReviewDetailTabHref(input.runId, "activity", { hash: "pipeline-timeline" }),
      actionLabel: "Continue analysis",
    });
  }

  if (input.hasCommitBlockingFailures || input.blockingFindingCount > 0) {
    const count = Math.max(input.blockingFindingCount, severityCounts.critical + severityCounts.high);

    actions.push({
      id: "review-blocking",
      title: "Review blocking findings",
      reason: `${count} unresolved finding${count === 1 ? "" : "s"} currently block approval or finalization.`,
      relatedFindingCount: count,
      ownerOrRole: null,
      href: buildReviewDetailTabHref(input.runId, "findings"),
      actionLabel: "Review findings",
    });
  } else if (severityCounts.critical > 0 || severityCounts.high > 0) {
    const count = severityCounts.critical + severityCounts.high;

    actions.push({
      id: "review-critical-high",
      title: "Review critical findings",
      reason: `${count} critical or high finding${count === 1 ? "" : "s"} need attention.`,
      relatedFindingCount: count,
      ownerOrRole: null,
      href: buildReviewDetailTabHref(input.runId, "findings"),
      actionLabel: "Review findings",
    });
  }

  if (unassignedHigh > 0) {
    actions.push({
      id: "assign-owners",
      title: `Assign owners to ${unassignedHigh} high finding${unassignedHigh === 1 ? "" : "s"}`,
      reason: "Remediation owners are not set for important findings.",
      relatedFindingCount: unassignedHigh,
      ownerOrRole: "Remediation lead",
      href: buildReviewDetailTabHref(input.runId, "findings"),
      actionLabel: "Assign owners",
    });
  }

  if (pendingDecision > 0) {
    actions.push({
      id: "record-decision",
      title: `Record a decision for ${pendingDecision} finding${pendingDecision === 1 ? "" : "s"}`,
      reason: "Human review decisions are still open.",
      relatedFindingCount: pendingDecision,
      ownerOrRole: "Governance reviewer",
      href: buildReviewDetailTabHref(input.runId, "decisions-remediation", { hash: "governance-decision" }),
      actionLabel: "Record decision",
    });
  }

  const evidenceCoverageComplete = input.evidenceCoverageComplete === true;

  if (evidenceGaps > 0 && !evidenceCoverageComplete && actions.length < 4) {
    actions.push({
      id: "add-evidence",
      title: "Add missing evidence",
      reason: `${evidenceGaps} finding${evidenceGaps === 1 ? "" : "s"} lack linked evidence citations.`,
      relatedFindingCount: evidenceGaps,
      ownerOrRole: null,
      href: buildReviewDetailTabHref(input.runId, "evidence"),
      actionLabel: "Add evidence",
    });
  }

  if (
    shouldShowRunDetailGovernanceCta({
      manifestId: input.manifestId,
      buyerPolishedArtifactTable: input.buyerPolishedArtifactTable,
      operatorGovernanceDecision: input.operatorGovernanceDecision,
      manifestStatus: input.manifestStatus,
    })
  ) {
    actions.push({
      id: "request-approval",
      title: "Request approval",
      reason: "Governance approval has not been recorded for this finalized review.",
      relatedFindingCount: null,
      ownerOrRole: "Governance approver",
      href: `/governance?runId=${encodeURIComponent(input.runId)}`,
      actionLabel: "Record decision",
    });
  }

  const manifestId = (input.manifestId ?? "").trim();

  if (manifestId.length === 0 && input.runCompleted && !input.hasCommitBlockingFailures) {
    actions.push({
      id: "finalize-review",
      title: "Finalize review",
      reason: "Analysis is complete — finalize to create the shareable review.",
      relatedFindingCount: null,
      ownerOrRole: "Review owner",
      href: buildReviewDetailTabHref(input.runId, "review-package"),
      actionLabel: "Finalize review",
    });
  }

  if (manifestId.length > 0) {
    actions.push({
      id: "open-package",
      title: "Open signed review record",
      reason: "Exports and deliverables are available for this finalized review.",
      relatedFindingCount: null,
      ownerOrRole: null,
      href: buildReviewDetailTabHref(input.runId, "review-package"),
      actionLabel: "Open record",
    });
  }

  return actions.slice(0, 5);
}

export function deriveExecutiveBottomLineContent(input: {
  readonly governanceDecisionLabel: string;
  readonly governanceDecisionRationale: string | null | undefined;
  readonly overallPosture: string;
  readonly blockingFindingCount: number;
  readonly highestSeverity: string | null;
  readonly themeSummaries: readonly string[] | null | undefined;
}): ExecutiveBottomLineContent | null {
  const decision = input.governanceDecisionLabel.trim();
  const rationale = (input.governanceDecisionRationale ?? "").trim();
  const themes = (input.themeSummaries ?? []).map((theme) => theme.trim()).filter((theme) => theme.length > 0);
  const hasGovernanceNarrative =
    decision.length > 0 &&
    decision !== "No governance decision recorded" &&
    (rationale.length > 0 || input.blockingFindingCount > 0 || input.overallPosture.length > 0);

  if (hasGovernanceNarrative) {
    const parts: string[] = [decision.endsWith(".") ? decision : `${decision}.`];

    if (rationale.length > 0) {
      parts.push(rationale.endsWith(".") ? rationale : `${rationale}.`);
    } else if (input.overallPosture.length > 0) {
      parts.push(`Overall posture is ${input.overallPosture.toLowerCase()}.`);
    }

    if (input.blockingFindingCount > 0) {
      const severityLabel = (input.highestSeverity ?? "material").toLowerCase();

      parts.push(
        `${input.blockingFindingCount} unresolved ${severityLabel} finding${input.blockingFindingCount === 1 ? "" : "s"} still require an assigned owner and supporting evidence before unrestricted production use.`,
      );
    }

    return { kind: "narrative", text: parts.join(" ") };
  }

  if (themes.length > 0) {
    return { kind: "considerations", themes };
  }

  return null;
}

export function deriveReviewDisplayTitle(run: RunSummary, headline: string): string {
  const buyerTitle = buyerFacingReviewTitleFromSummary(run).trim();

  if (buyerTitle.length > 0 && buyerTitle !== "Untitled review") {
    return buyerTitle;
  }

  return headline.trim().length > 0 ? headline : "Architecture review";
}

export function deriveOverallPostureLabel(
  riskPosture: string | null | undefined,
  governanceGateLabel: string | null | undefined,
  highestSeverity: string | null,
): string {
  const posture = riskPosture?.trim() ?? "";

  if (posture.length > 0) {
    return posture;
  }

  const gate = governanceGateLabel?.trim() ?? "";

  if (gate.length > 0) {
    return gate;
  }

  return highestSeverity ?? "Not assessed";
}

export function countFindingsAwaitingAction(findings: readonly QuickDecisionFinding[]): number {
  return findings.filter((finding) => {
    if (finding.isMuted) {
      return false;
    }

    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (status?.label === "Pending review" || status?.label === "Rejected") {
      return true;
    }

    return finding.severityValue >= 2;
  }).length;
}

export function severityLabelForFinding(finding: QuickDecisionFinding): string {
  return severityBadgeLabel(finding.severityValue);
}
