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


;















/**
 * Timestamp for the header "Finalized at" slot.
 * Never falls back to run.createdUtc — that would label in-progress reviews as finalized.
 */




export function runAnalysisComplete(run: RunDetail["run"]): boolean {
  const completedUtc = run.completedUtc?.trim() ?? "";

  if (completedUtc.length > 0) {
    return true;
  }

  const legacyStatus = run.legacyRunStatus?.trim() ?? "";

  return legacyStatus === "Completed";
}





export function isFindingResolved(finding: QuickDecisionFinding): boolean {
  const status = humanReviewStatusDisplay(finding.humanReviewStatus);

  return status?.label === "Approved" || status?.label === "Overridden";
}











/**
 * Reconciles the Decision snapshot governance line with the header status verdict.
 *
 * The header status already encodes blocking state (for example "Finalized · approval blocked"), so a
 * bare "Pending" in the snapshot reads as a second, competing verdict for the same review. When
 * approval is blocked, the snapshot restates *why* instead of asserting an independent outcome.
 */


/** One-line findings summary for the decision snapshot — reconciles open, blocking, and triage counts. */
















/**
 * Primary CTAs need short imperative labels, not truncated prose.
 * Prefer the verb phrase before an em dash when it already fits a button;
 * otherwise return null so callers keep their fixed label (e.g. "Review findings").
 */
