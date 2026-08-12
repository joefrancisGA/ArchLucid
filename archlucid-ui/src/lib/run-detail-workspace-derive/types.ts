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
}
export type EvidenceCoverageSummary = {
  readonly linkedCount: number;
  readonly totalCount: number;
  readonly summaryLine: string;
}
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
}
export type FindingSeverityCounts = {
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
}
export type RunDetailWorkspaceRecommendedAction = {
  readonly id: string;
  readonly title: string;
  readonly reason: string;
  readonly relatedFindingCount: number | null;
  readonly ownerOrRole: string | null;
  readonly href: string;
  readonly actionLabel: string;
}
export type ReviewStatusSummary = {
  readonly reviewOutcome: string;
  readonly highestUnresolvedSeverity: string | null;
  readonly openFindingsCount: number;
  readonly findingsRequiringActionCount: number;
  readonly primaryConcern: string | null;
  readonly nextAction: string;
}
export type ExecutiveBottomLineContent =
  | {
      readonly kind: "narrative";
      readonly text: string;
    }
export type DeriveRunDetailWorkspaceStatusInput = {
  readonly run: RunDetail["run"];
  readonly manifestId: string | null | undefined;
  readonly manifestStatus: string | null | undefined;
  readonly showProgressTracker: boolean;
  readonly operatorGovernanceDecision: string | null | undefined;
  readonly buyerPolishedArtifactTable: boolean;
  /** Open findings that block approval — used to avoid a bare "Finalized" tag when approval is still blocked. */
  readonly blockingFindingCount?: number;
}
