import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { deriveRunListPipelineLabel } from "@/components/runs/RunStatusBadge";
import { governanceGateLabelFromManifestStatus } from "@/lib/governance/governance-gate-display";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { shouldShowRunDetailGovernanceCta } from "@/lib/runs/run-detail-governance-cta-visibility";
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

import type {
  RunDetailWorkspaceRecommendedAction
} from "./types";
import { countFindingsBySeverity, derivePrimaryConcernFinding, filterUnresolvedFindings } from "./finding-metrics";
import { isFindingResolved } from "./internal";
import { resolveBlockingFindingCountPresentation } from "./blocking-finding-count-display";

const WORKSPACE_RECOMMENDED_ACTION_SYNTHETIC_ROLES = new Set([
  "Review owner",
  "Remediation lead",
  "Approval reviewer",
]);

export function normalizeWorkspaceRecommendedActionOwnerOrRole(
  ownerOrRole: string | null | undefined,
): string | null {
  if (ownerOrRole === null || ownerOrRole === undefined) {
    return null;
  }

  const trimmed = ownerOrRole.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (WORKSPACE_RECOMMENDED_ACTION_SYNTHETIC_ROLES.has(trimmed)) {
    return null;
  }

  return trimmed;
}

export function deriveBlockingApprovalCount(input: {
  readonly unresolvedIssueCount: number | null | undefined;
  readonly hasCommitBlockingFailures: boolean;
  readonly findings: readonly QuickDecisionFinding[];
}): number | null {
  if (typeof input.unresolvedIssueCount === "number" && Number.isFinite(input.unresolvedIssueCount)) {
    const n = Math.trunc(input.unresolvedIssueCount);

    if (n > 0) {
      return n;
    }

    if (!input.hasCommitBlockingFailures) {
      return 0;
    }
  } else if (!input.hasCommitBlockingFailures) {
    return null;
  }

  if (input.hasCommitBlockingFailures) {
    return input.findings.filter(
      (finding) =>
        !finding.isMuted &&
        finding.enforcementTier !== "Advisory" &&
        !isFindingResolved(finding),
    ).length;
  }

  return null;
}
export function deriveRecommendedWorkspaceActions(input: {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly manifestId: string | null | undefined;
  readonly showProgressTracker: boolean;
  readonly hasCommitBlockingFailures: boolean;
  readonly blockingFindingCount?: number;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly runCompleted: boolean;
  readonly evidenceCoverageComplete?: boolean;
  /** When the header primary CTA already targets findings, omit duplicate findings rows here. */
  readonly skipDuplicateFindingsActions?: boolean;
}): RunDetailWorkspaceRecommendedAction[] {
  const actions: RunDetailWorkspaceRecommendedAction[] = [];
  const unresolvedFindings = filterUnresolvedFindings(input.findings);
  const severityCounts = countFindingsBySeverity(unresolvedFindings);
  const unassignedHigh = input.findings.filter(
    (finding) =>
      !finding.isMuted &&
      !isFindingResolved(finding) &&
      finding.severityValue !== null &&
      finding.severityValue >= 2 &&
      (finding.assignedToUserId?.trim() ?? "").length === 0,
  ).length;
  const pendingDecision = input.findings.filter((finding) => {
    if (finding.isMuted || isFindingResolved(finding)) {
      return false;
    }

    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    return status?.label === "Pending review";
  }).length;
  const evidenceGaps = input.findings.filter(
    (finding) => !finding.isMuted && !isFindingResolved(finding) && finding.evidenceRefCount === 0,
  ).length;
  const evidenceRefCountNotStored = input.findings.filter(
    (finding) =>
      !finding.isMuted &&
      !isFindingResolved(finding) &&
      (finding.evidenceRefCount === null || finding.evidenceRefCount === undefined),
  ).length;

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

  const blockingPresentation = resolveBlockingFindingCountPresentation(input.blockingFindingCount);
  const hasKnownBlockingCount = blockingPresentation.known && blockingPresentation.value > 0;
  const severityBlockingCount = severityCounts.critical + severityCounts.high;
  const shouldReviewBlockingFindings =
    input.hasCommitBlockingFailures
    || hasKnownBlockingCount
    || (!blockingPresentation.known && severityBlockingCount > 0);

  if (shouldReviewBlockingFindings) {
    if (!input.skipDuplicateFindingsActions) {
      if (!blockingPresentation.known && input.hasCommitBlockingFailures) {
        actions.push({
          id: "review-blocking",
          title: "Review blocking findings",
          reason:
            "Blocking finding count was not stored — review open findings before approval or finalization.",
          relatedFindingCount: null,
          ownerOrRole: null,
          href: buildReviewDetailTabHref(input.runId, "findings"),
          actionLabel: "Review findings",
        });
      } else if (blockingPresentation.known && blockingPresentation.value === 0) {
        if (input.hasCommitBlockingFailures) {
          actions.push({
            id: "review-blocking",
            title: "Review blocking findings",
            reason:
              "Blocking finding count was stored as 0 — review open findings before approval or finalization.",
            relatedFindingCount: 0,
            ownerOrRole: null,
            href: buildReviewDetailTabHref(input.runId, "findings"),
            actionLabel: "Review findings",
          });
        }
      } else if (blockingPresentation.known) {
        const count = blockingPresentation.value;
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
      } else {
        const tallyNote =
          severityBlockingCount > 0
            ? ` ${severityBlockingCount} critical or high finding${severityBlockingCount === 1 ? "" : "s"} were stored. This tally is severity, not a stored blocking count.`
            : "";

        actions.push({
          id: "review-blocking",
          title: "Review blocking findings",
          reason: `Blocking finding count was not stored.${tallyNote}`,
          relatedFindingCount: null,
          ownerOrRole: null,
          href: buildReviewDetailTabHref(input.runId, "findings"),
          actionLabel: "Review findings",
        });
      }
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
      title: "Open findings",
      reason: "Owner was not stored for important findings.",
      relatedFindingCount: unassignedHigh,
      ownerOrRole: "Remediation lead",
      href: buildReviewDetailTabHref(input.runId, "findings"),
      actionLabel: "Open findings",
    });
  }

  if (pendingDecision > 0) {
    actions.push({
      id: "record-decision",
      title: `Record a decision for ${pendingDecision} finding${pendingDecision === 1 ? "" : "s"}`,
      reason: "Human review decisions are still open.",
      relatedFindingCount: pendingDecision,
      ownerOrRole: "Approval reviewer",
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

  if (evidenceRefCountNotStored > 0 && actions.length < 4) {
    actions.push({
      id: "evidence-ref-count-not-stored",
      title: "Review evidence reference counts",
      reason: `Evidence reference count was not stored for ${evidenceRefCountNotStored} open finding${evidenceRefCountNotStored === 1 ? "" : "s"}.`,
      relatedFindingCount: evidenceRefCountNotStored,
      ownerOrRole: null,
      href: buildReviewDetailTabHref(input.runId, "findings"),
      actionLabel: "Open findings",
    });
  }

  if (
    shouldShowRunDetailGovernanceCta({
      runId: input.runId,
      manifestId: input.manifestId,
      buyerPolishedArtifactTable: input.buyerPolishedArtifactTable,
      operatorGovernanceDecision: input.operatorGovernanceDecision,
      manifestStatus: input.manifestStatus,
    })
  ) {
    actions.push({
      id: "request-approval",
      title: "Request approval",
      reason: "Approval has not been recorded for this finalized review.",
      relatedFindingCount: null,
      ownerOrRole: "Approval lead",
      href: `/governance/approval-queue?runId=${encodeURIComponent(input.runId)}`,
      actionLabel: "Open approval queue",
    });
  }

  const manifestId = (input.manifestId ?? "").trim();

  if (manifestId.length === 0 && input.runCompleted && !input.hasCommitBlockingFailures) {
    actions.push({
      id: "finalize-review",
      title: "Finalize review",
      reason:
        "The run has finished. Read the diagram and findings, ask one question, then finalize the shareable review.",
      relatedFindingCount: null,
      ownerOrRole: "Review owner",
      href: buildReviewDetailTabHref(input.runId, "review-package"),
      actionLabel: "Finalize review",
    });
  }

  if (manifestId.length > 0) {
    actions.push({
      id: "open-package",
      title: "Open finalized review record",
      reason: "Exports and deliverables are available for this finalized review.",
      relatedFindingCount: null,
      ownerOrRole: null,
      href: buildReviewDetailTabHref(input.runId, "review-package"),
      actionLabel: "Open record",
    });
  }

  return actions.slice(0, 5);
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
