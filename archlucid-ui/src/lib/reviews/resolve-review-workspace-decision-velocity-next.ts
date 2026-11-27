import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import type { RunDetailWorkspaceStatus } from "@/lib/run-detail-workspace-derive";
import {
  RUN_DETAIL_GOVERNANCE_CTA_LABEL,
  runDetailGovernanceWorkflowHref,
  shouldShowRunDetailGovernanceCta,
} from "@/lib/runs/run-detail-governance-cta-visibility";
import {
  REVIEW_WORKSPACE_DECISION_VELOCITY_ACTIVITY_CTA,
  REVIEW_WORKSPACE_DECISION_VELOCITY_APPROVAL_LEAD,
  REVIEW_WORKSPACE_DECISION_VELOCITY_BLOCKING_LEAD,
  REVIEW_WORKSPACE_DECISION_VELOCITY_FINALIZE_LEAD,
  REVIEW_WORKSPACE_DECISION_VELOCITY_FINDINGS_CTA,
} from "@/lib/reviews/review-workspace-decision-velocity-copy";

export type ReviewWorkspaceDecisionVelocityNext = {
  readonly lead: string;
  readonly ctaLabel: string;
  readonly href: string;
};

export type ResolveReviewWorkspaceDecisionVelocityNextInput = {
  readonly runId: string;
  readonly signedReviewRecordId: string | null;
  readonly workspaceStatusKind: RunDetailWorkspaceStatus["kind"];
  readonly blockingApprovalCount: number;
  readonly buyerPolishedArtifactTable: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
};

const SKIPPED_WORKSPACE_KINDS: ReadonlySet<RunDetailWorkspaceStatus["kind"]> = new Set([
  "execution-failed",
  "quality-gate-rejected",
]);

export function resolveReviewWorkspaceDecisionVelocityNext(
  input: ResolveReviewWorkspaceDecisionVelocityNextInput,
): ReviewWorkspaceDecisionVelocityNext | null {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return null;
  }

  if (SKIPPED_WORKSPACE_KINDS.has(input.workspaceStatusKind)) {
    return null;
  }

  const manifestId = (input.signedReviewRecordId ?? "").trim();

  if (
    manifestId.length > 0
    && shouldShowRunDetailGovernanceCta({
      runId,
      manifestId,
      buyerPolishedArtifactTable: input.buyerPolishedArtifactTable,
      operatorGovernanceDecision: input.operatorGovernanceDecision,
      manifestStatus: input.manifestStatus,
    })
  ) {
    return {
      lead: REVIEW_WORKSPACE_DECISION_VELOCITY_APPROVAL_LEAD,
      ctaLabel: RUN_DETAIL_GOVERNANCE_CTA_LABEL,
      href: runDetailGovernanceWorkflowHref(runId),
    };
  }

  if (manifestId.length > 0) {
    return null;
  }

  if (input.blockingApprovalCount > 0) {
    return {
      lead: REVIEW_WORKSPACE_DECISION_VELOCITY_BLOCKING_LEAD,
      ctaLabel: REVIEW_WORKSPACE_DECISION_VELOCITY_FINDINGS_CTA,
      href: buildReviewDetailTabHref(runId, "findings"),
    };
  }

  return {
    lead: REVIEW_WORKSPACE_DECISION_VELOCITY_FINALIZE_LEAD,
    ctaLabel: REVIEW_WORKSPACE_DECISION_VELOCITY_ACTIVITY_CTA,
    href: buildReviewDetailTabHref(runId, "activity", { hash: "architecture-assessment-progress" }),
  };
}
