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
