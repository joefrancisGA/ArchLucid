import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import { deriveRunListPipelineLabel } from "@/components/RunStatusBadge";
import { governanceGateLabelFromManifestStatus } from "@/lib/governance/governance-gate-display";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
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

import { isProductBrandReviewTitle } from "./review-presentation";
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
