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
  sortQuickDecisionFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { evidenceAbsenceFindingLabel } from "@/lib/evidence-absence-finding-copy";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { isGeneratedIntakeBrief, toReviewDisplayTitle } from "@/lib/review-display-title";
import {
  isQualityRejectedRunStatus,
  resolveExecutionFailedWorkspaceStatusLabel,
  resolveQualityRejectedWorkspaceStatusLabel,
} from "@/lib/execution-vs-quality-outcome-copy";
import type { ManifestSummary, RunDetail, RunSummary } from "@/types/authority";

const PRODUCT_BRAND_NAME = "ArchLucid";

export type ReviewHeaderPresentation = {
  readonly h1Title: string;
  readonly eyebrowLabel: string;
  readonly reviewIdentifierLabel: string;
};

export type EvidenceCoverageSummary = {
  readonly linkedCount: number;
  readonly totalCount: number;
  readonly summaryLine: string;
};

export type RunDetailWorkspaceStatusKind =
  | "draft"
  | "analysis-in-progress"
  | "review-complete"
  | "awaiting-decision"
  | "changes-requested"
  | "approved"
  | "finalized"
  | "quality-gate-rejected"
  | "execution-failed";

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

export type ReviewStatusSummary = {
  readonly reviewOutcome: string;
  readonly highestUnresolvedSeverity: string | null;
  readonly openFindingsCount: number;
  readonly findingsRequiringActionCount: number;
  readonly primaryConcern: string | null;
  readonly nextAction: string;
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
  /** Open findings that block approval — used to avoid a bare "Finalized" tag when approval is still blocked. */
  readonly blockingFindingCount?: number;
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

  // The auto-generated intake brief is boilerplate, not a system name the operator supplied.
  // When the operator names the system ArchLucid (or any non-generic title), displayName may match
  // the review headline — still prefer that name over the generic "Architecture under review" fallback.
  if (displayName.length > 0 && !isGeneratedIntakeBrief(displayName)) {
    const headlineMatchesDisplayName = displayName === headline;
    const headlineIsGenericPlaceholder =
      isProductBrandReviewTitle(headline) &&
      headline.trim().toLowerCase() !== PRODUCT_BRAND_NAME.toLowerCase();

    if (!headlineMatchesDisplayName || !headlineIsGenericPlaceholder) {
      return displayName;
    }
  }

  const description = run.description?.trim() ?? "";
  const runId = run.runId?.trim() ?? "";

  if (
    description.length > 0 &&
    description !== headline &&
    description !== runId &&
    description.toLowerCase() !== runId.toLowerCase() &&
    !isGeneratedIntakeBrief(description)
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

  // The auto-generated intake brief is not architecture content the operator submitted.
  if (isGeneratedIntakeBrief(description)) {
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

  const ruleSetId = manifestSummary.ruleSetId?.trim() ?? "";

  // Dev/in-memory rule sets are not buyer-facing template names.
  if (ruleSetId.toLowerCase() === "in-memory" || ruleSetId.toLowerCase().includes("in-memory")) {
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

/**
 * Timestamp for the header "Finalized at" slot.
 * Never falls back to run.createdUtc — that would label in-progress reviews as finalized.
 */
export function deriveFinalizedAtUtc(
  run: RunDetail["run"],
  manifestSummary: ManifestSummary | null,
  manifestId: string | null | undefined,
): string | null {
  const hasManifest = (manifestId ?? "").trim().length > 0;
  const completedUtc = run.completedUtc?.trim() ?? "";

  if (completedUtc.length > 0 && hasManifest) {
    return completedUtc;
  }

  if (!hasManifest) {
    return null;
  }

  const manifestUtc = manifestSummary?.createdUtc?.trim() ?? "";

  return manifestUtc.length > 0 ? manifestUtc : null;
}

export function deriveRunDetailWorkspaceStatus(input: DeriveRunDetailWorkspaceStatusInput): RunDetailWorkspaceStatus {
  const manifestId = (input.manifestId ?? "").trim();
  const governanceDecision = (input.operatorGovernanceDecision ?? "").trim();
  const manifestStatus = manifestStatusForDisplay(input.manifestStatus);
  const gateLabel = governanceGateLabelFromManifestStatus(input.manifestStatus);
  const pipelineLabel = deriveRunListPipelineLabel(input.run as RunSummary);
  const legacyStatus = (input.run.legacyRunStatus ?? "").trim();

  // TB-965: quality reject ≠ outage; surface before generic draft/complete labels.
  if (manifestId.length === 0 && isQualityRejectedRunStatus(legacyStatus)) {
    return {
      label: resolveQualityRejectedWorkspaceStatusLabel(),
      kind: "quality-gate-rejected",
      statusTagKind: "needs-attention",
    };
  }

  if (manifestId.length === 0 && legacyStatus === "Failed") {
    return {
      label: resolveExecutionFailedWorkspaceStatusLabel(),
      kind: "execution-failed",
      statusTagKind: "needs-attention",
    };
  }

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

    const blockingCount = input.blockingFindingCount ?? 0;
    const governancePending =
      gateLabel === "Pending" ||
      /pending/i.test(governanceDecision) ||
      shouldShowRunDetailGovernanceCta({
        manifestId,
        buyerPolishedArtifactTable: input.buyerPolishedArtifactTable,
        operatorGovernanceDecision: input.operatorGovernanceDecision,
        manifestStatus: input.manifestStatus,
      });
    const isFinalized =
      manifestStatus === "Finalized" || pipelineLabel === PIPELINE_STATUS_LABELS.finalized;

    if (isFinalized) {
      if (blockingCount > 0) {
        return {
          label: "Finalized · approval blocked",
          kind: "finalized",
          statusTagKind: "needs-attention",
        };
      }

      if (governancePending) {
        return {
          label: "Finalized · decision pending",
          kind: "finalized",
          statusTagKind: "needs-attention",
        };
      }

      if (/approv/i.test(governanceDecision) || gateLabel === "Passed") {
        return { label: "Approved", kind: "approved", statusTagKind: "approved" };
      }

      return { label: "Finalized", kind: "finalized", statusTagKind: "ready" };
    }

    if (blockingCount > 0) {
      return {
        label: "Review complete · approval blocked",
        kind: "review-complete",
        statusTagKind: "needs-attention",
      };
    }

    if (/approv/i.test(governanceDecision) || gateLabel === "Passed") {
      return { label: "Approved", kind: "approved", statusTagKind: "approved" };
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
  /** When the header primary CTA already targets findings, omit duplicate findings rows here. */
  readonly skipDuplicateFindingsActions?: boolean;
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

    if (!input.skipDuplicateFindingsActions) {
      const verb = count === 1 ? "blocks" : "block";

      actions.push({
        id: "review-blocking",
        title: "Review blocking findings",
        reason: `${count} unresolved finding${count === 1 ? "" : "s"} currently ${verb} approval or finalization.`,
        relatedFindingCount: count,
        ownerOrRole: null,
        href: buildReviewDetailTabHref(input.runId, "findings"),
        actionLabel: "Review findings",
      });
    }
  } else if (severityCounts.critical > 0 || severityCounts.high > 0) {
    const count = severityCounts.critical + severityCounts.high;

    if (!input.skipDuplicateFindingsActions) {
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
      href: `/governance/approval-queue?runId=${encodeURIComponent(input.runId)}`,
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

function isFindingResolved(finding: QuickDecisionFinding): boolean {
  const status = humanReviewStatusDisplay(finding.humanReviewStatus);

  return status?.label === "Approved" || status?.label === "Overridden";
}

export function filterUnresolvedFindings(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding[] {
  return findings.filter((finding) => !finding.isMuted && !isFindingResolved(finding));
}

export function countOpenFindings(findings: readonly QuickDecisionFinding[]): number {
  return filterUnresolvedFindings(findings).length;
}

export function deriveHighestUnresolvedSeverityLabel(
  findings: readonly QuickDecisionFinding[],
): string | null {
  return deriveHighestFindingSeverityLabel(filterUnresolvedFindings(findings), null);
}

export function derivePrimaryConcernFinding(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding | null {
  const unresolved = filterUnresolvedFindings(findings);

  if (unresolved.length === 0) {
    return null;
  }

  const sorted = sortQuickDecisionFindings(unresolved);

  return sorted[0] ?? null;
}

export function derivePrimaryConcernLabel(findings: readonly QuickDecisionFinding[]): string | null {
  const title = derivePrimaryConcernFinding(findings)?.title ?? null;

  if (title === null) {
    return null;
  }

  return evidenceAbsenceFindingLabel(title);
}

/**
 * Reconciles the Decision snapshot governance line with the header status verdict.
 *
 * The header status already encodes blocking state (for example "Finalized · approval blocked"), so a
 * bare "Pending" in the snapshot reads as a second, competing verdict for the same review. When
 * approval is blocked, the snapshot restates *why* instead of asserting an independent outcome.
 */
export function formatDecisionSnapshotGovernanceOutcome(input: {
  readonly governanceDecisionLabel: string;
  readonly blockingFindingCount: number;
}): string {
  const label = input.governanceDecisionLabel.trim();

  if (input.blockingFindingCount <= 0) {
    return label;
  }

  // Already qualified upstream — do not append a second qualifier.
  if (/blocked/i.test(label)) {
    return label;
  }

  const noun = input.blockingFindingCount === 1 ? "finding" : "findings";

  return `${label} · blocked by ${input.blockingFindingCount} unresolved ${noun}`;
}

/** One-line findings summary for the decision snapshot — reconciles open, blocking, and triage counts. */
export function formatDecisionSnapshotFindingsLine(
  openCount: number,
  blockingCount: number,
  awaitingActionCount: number,
): string {
  if (openCount <= 0) {
    return "None open";
  }

  const segments: string[] = [`${openCount} open`];

  if (blockingCount > 0) {
    segments.push(`${blockingCount} block${blockingCount === 1 ? "s" : ""} approval`);
  }

  const triageOnly = Math.max(0, awaitingActionCount - blockingCount);

  if (triageOnly > 0) {
    segments.push(`${triageOnly} need${triageOnly === 1 ? "s" : ""} triage`);
  }

  return segments.join(" · ");
}

export function deriveReviewNextActionLabel(input: {
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly primaryConcernFinding: QuickDecisionFinding | null;
  readonly blockingFindingCount: number;
}): string {
  const primary = input.primaryConcernFinding;

  if (primary !== null) {
    const status = humanReviewStatusDisplay(primary.humanReviewStatus);
    const isUnresolved = status?.label !== "Approved" && status?.label !== "Overridden";

    if (isUnresolved) {
      const severity = severityBadgeLabel(primary.severityValue).toLowerCase();

      return `Confirm evidence and remediation ownership for the open ${severity}-severity finding`;
    }
  }

  if (primary !== null && (primary.evidenceRefCount ?? 0) === 0) {
    return `Confirm evidence and remediation ownership for ${primary.title}`;
  }

  const evidenceAction = input.recommendedActions.find((action) => action.id === "add-evidence");

  if (evidenceAction !== undefined) {
    return `${evidenceAction.actionLabel} — ${evidenceAction.reason}`;
  }

  const blockingAction = input.recommendedActions.find((action) => action.id === "review-blocking");

  if (blockingAction !== undefined) {
    return `${blockingAction.actionLabel} — ${blockingAction.reason}`;
  }

  const first = input.recommendedActions[0];

  if (first !== undefined) {
    return `${first.actionLabel} — ${first.reason}`;
  }

  return "No immediate actions required — monitor findings and evidence coverage.";
}

export function deriveReviewStatusSummary(input: {
  readonly reviewOutcome: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly blockingFindingCount: number;
}): ReviewStatusSummary {
  const primaryConcernFinding = derivePrimaryConcernFinding(input.findings);

  return {
    reviewOutcome: input.reviewOutcome,
    highestUnresolvedSeverity: deriveHighestUnresolvedSeverityLabel(input.findings),
    openFindingsCount: countOpenFindings(input.findings),
    findingsRequiringActionCount: countFindingsAwaitingAction(input.findings),
    primaryConcern: derivePrimaryConcernLabel(input.findings),
    nextAction: deriveReviewNextActionLabel({
      recommendedActions: input.recommendedActions,
      primaryConcernFinding,
      blockingFindingCount: input.blockingFindingCount,
    }),
  };
}

export function deriveExecutiveBottomLineContent(input: {
  readonly governanceDecisionLabel: string;
  readonly governanceDecisionRationale: string | null | undefined;
  readonly overallPosture: string;
  readonly blockingFindingCount: number;
  readonly highestSeverity: string | null;
  readonly themeSummaries: readonly string[] | null | undefined;
}): ExecutiveBottomLineContent | null {
  const rationale = (input.governanceDecisionRationale ?? "").trim();
  const themes = (input.themeSummaries ?? []).map((theme) => theme.trim()).filter((theme) => theme.length > 0);
  const parts: string[] = [];

  if (rationale.length > 0) {
    parts.push(rationale.endsWith(".") ? rationale : `${rationale}.`);
  }

  // Blocking-finding counts live in Decision snapshot — do not repeat in Additional context.

  if (parts.length > 0) {
    return { kind: "narrative", text: parts.join(" ") };
  }

  if (themes.length > 0) {
    return { kind: "considerations", themes };
  }

  return null;
}

export function isProductBrandReviewTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();

  return normalized === PRODUCT_BRAND_NAME.toLowerCase() || normalized === "architecture review";
}

export function deriveReviewHeaderPresentation(input: {
  readonly reviewTitle: string;
  readonly systemName: string | null;
  readonly runId: string;
  readonly templateLabel?: string | null;
  readonly manifestId?: string | null;
}): ReviewHeaderPresentation {
  const reviewTitle = input.reviewTitle.trim();
  const systemName = input.systemName?.trim() ?? "";
  const templateLabel = input.templateLabel?.trim() ?? "";
  const hasManifest = (input.manifestId ?? "").trim().length > 0;
  const runId = input.runId.trim();
  const shortReviewId =
    runId.length > 12 ? `${runId.slice(0, 8)}…${runId.slice(-4)}` : runId;

  if (systemName.length > 0) {
    const eyebrow =
      reviewTitle.length > 0 && !isProductBrandReviewTitle(reviewTitle)
        ? reviewTitle
        : "Architecture review";

    return {
      h1Title: systemName,
      eyebrowLabel: eyebrow,
      reviewIdentifierLabel: shortReviewId.length > 0 ? shortReviewId : runId,
    };
  }

  if (reviewTitle.length > 0 && !isProductBrandReviewTitle(reviewTitle)) {
    return {
      h1Title: reviewTitle,
      eyebrowLabel: "Architecture review",
      reviewIdentifierLabel: shortReviewId.length > 0 ? shortReviewId : runId,
    };
  }

  if (hasManifest && templateLabel.length > 0) {
    return {
      h1Title: templateLabel,
      eyebrowLabel: "Architecture review",
      reviewIdentifierLabel: shortReviewId.length > 0 ? shortReviewId : runId,
    };
  }

  if (reviewTitle.length > 0 && reviewTitle.toLowerCase() === PRODUCT_BRAND_NAME.toLowerCase()) {
    return {
      h1Title: PRODUCT_BRAND_NAME,
      eyebrowLabel: "Architecture review",
      reviewIdentifierLabel: shortReviewId.length > 0 ? shortReviewId : runId,
    };
  }

  return {
    h1Title: "Architecture under review",
    eyebrowLabel: "Architecture review",
    reviewIdentifierLabel: shortReviewId.length > 0 ? shortReviewId : runId,
  };
}

export function derivePackageVersionLabel(
  manifestSummary: ManifestSummary | null,
  manifestId: string | null | undefined,
): string | null {
  const version = manifestSummary?.ruleSetVersion?.trim() ?? "";

  if (version.length > 0) {
    return version;
  }

  const manifest = (manifestId ?? "").trim();

  if (manifest.length > 0) {
    return manifest.length > 16 ? `${manifest.slice(0, 8)}…${manifest.slice(-4)}` : manifest;
  }

  return null;
}

export function deriveEvidenceCoverageSummary(
  findings: readonly QuickDecisionFinding[],
): EvidenceCoverageSummary {
  const unresolved = filterUnresolvedFindings(findings);
  const totalCount = unresolved.length;

  if (totalCount === 0) {
    return {
      linkedCount: 0,
      totalCount: 0,
      summaryLine: "No open findings",
    };
  }

  const linkedCount = unresolved.filter((finding) => (finding.evidenceRefCount ?? 0) > 0).length;
  const noun = totalCount === 1 ? "finding has" : "findings have";

  return {
    linkedCount,
    totalCount,
    summaryLine: `${linkedCount} of ${totalCount} open ${noun} linked evidence`,
  };
}

/**
 * Primary CTAs need short imperative labels, not truncated prose.
 * Prefer the verb phrase before an em dash when it already fits a button;
 * otherwise return null so callers keep their fixed label (e.g. "Review findings").
 */
export function shortenNextActionForPrimaryCta(nextAction: string): string | null {
  const trimmed = nextAction.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const primarySegment = trimmed.split(" — ")[0]?.trim() ?? trimmed;

  if (primarySegment.length === 0 || primarySegment.length > 24) {
    return null;
  }

  return primarySegment;
}

export function deriveBlockingFindingHref(
  runId: string,
  findings: readonly QuickDecisionFinding[],
): string {
  const primaryFinding = derivePrimaryConcernFinding(findings);

  if (primaryFinding !== null) {
    return buildReviewDetailTabHref(runId, "findings", {
      hash: `finding-workspace-card-${primaryFinding.findingId}`,
    });
  }

  return buildReviewDetailTabHref(runId, "findings");
}

export function deriveReviewDisplayTitle(run: RunSummary, headline: string): string {
  const buyerTitle = buyerFacingReviewTitleFromSummary(run).trim();

  if (buyerTitle.length > 0 && buyerTitle !== "Untitled review") {
    return buyerTitle;
  }

  const normalizedHeadline = toReviewDisplayTitle(headline);

  return normalizedHeadline.length > 0 ? normalizedHeadline : "Architecture review";
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
