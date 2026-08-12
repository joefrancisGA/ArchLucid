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

import {
  runAnalysisComplete
} from "./internal";
import type {
  DeriveRunDetailWorkspaceStatusInput,
  RunDetailWorkspaceStatus
} from "./types";
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
