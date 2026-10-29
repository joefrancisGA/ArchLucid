import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";
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
import { extractAttachedIntakeFileNames } from "@/lib/intake-attached-file-names";
import {
  clampReviewWorkspaceH1Title,
  isGeneratedIntakeBrief,
  isUnusableReviewTitleCandidate,
  toReviewDisplayTitle,
} from "@/lib/review-display-title";
import {
  isQualityRejectedRunStatus,
  resolveExecutionFailedWorkspaceStatusLabel,
  resolveQualityRejectedWorkspaceStatusLabel,
} from "@/lib/execution-vs-quality-outcome-copy";
import type { ManifestSummary, RunDetail, RunSummary } from "@/types/authority";

const PRODUCT_BRAND_NAME = "ArchLucid";

import { isProductBrandReviewTitle } from "./review-presentation";

export type ReviewRecordMetadataContext = "not-finalized" | "incomplete-record";

export type ReviewMetadataAbsentReasons = {
  readonly governanceDecisionRecordedBy: string;
  readonly reviewTemplate: string;
  readonly finalizedAt: string;
  readonly packageVersion: string;
  readonly signedReviewRecordId: string;
};

/** Shown when a finalized review record exists but a specific metadata field is missing. */
export const REVIEW_METADATA_NOT_RECORDED_REASONS: ReviewMetadataAbsentReasons = {
  governanceDecisionRecordedBy: "Governance decision recorder was not stored.",
  reviewTemplate: "Review template was not stored.",
  finalizedAt: "Finalization time was not stored.",
  packageVersion: "Package version was not stored.",
  signedReviewRecordId: "Finalized review record ID was not stored.",
};

/**
 * Shown when the review has not produced a finalized record yet (draft, in progress, or execution failed).
 * Avoids implying ArchLucid failed to persist data that only exists after finalization.
 */
export const REVIEW_METADATA_NOT_FINALIZED_REASONS: ReviewMetadataAbsentReasons = {
  governanceDecisionRecordedBy: "Not applicable — no approval decision until the review is finalized",
  reviewTemplate: "Not applicable — review template is recorded when the review finalizes",
  finalizedAt: "Not applicable — review has not been finalized",
  packageVersion: "Not applicable — package version is recorded when the review finalizes",
  signedReviewRecordId: "Not applicable — no finalized review record yet",
};

export function deriveReviewRecordMetadataContext(
  manifestId: string | null | undefined,
): ReviewRecordMetadataContext {
  const hasManifest = (manifestId ?? "").trim().length > 0;

  return hasManifest ? "incomplete-record" : "not-finalized";
}

export function resolveReviewMetadataAbsentReasons(
  context: ReviewRecordMetadataContext,
): ReviewMetadataAbsentReasons {
  return context === "not-finalized"
    ? REVIEW_METADATA_NOT_FINALIZED_REASONS
    : REVIEW_METADATA_NOT_RECORDED_REASONS;
}

export function deriveSignedReviewRecordIdLabel(manifestId: string | null | undefined): string | null {
  const manifest = (manifestId ?? "").trim();

  if (manifest.length === 0) {
    return null;
  }

  return manifest.length > 16 ? `${manifest.slice(0, 8)}…${manifest.slice(-4)}` : manifest;
}

export const RUN_DETAIL_ACTIONS_SYSTEM_NAME_NOT_STORED = "System name was not stored." as const;

/** Label for run action chrome — never substitutes the technical run id for a missing system name. */
export function resolveRunDetailActionsSystemNameLabel(run: RunSummary, headline: string): string {
  const derived = deriveArchitectureSystemName(run, headline);

  if (derived !== null && derived.trim().length > 0) {
    return derived;
  }

  const submitted = deriveSubmittedArchitectureText(run, headline);

  if (submitted !== null && submitted.trim().length > 0) {
    return submitted;
  }

  return RUN_DETAIL_ACTIONS_SYSTEM_NAME_NOT_STORED;
}

export function deriveArchitectureSystemName(run: RunSummary, headline: string): string | null {
  const displayName = run.displayName?.trim() ?? "";

  // The auto-generated intake brief is boilerplate, not a system name the operator supplied.
  // When the operator names the system ArchLucid (or any non-generic title), displayName may match
  // the review headline — still prefer that name over the generic "Architecture review" fallback.
  if (displayName.length > 0 && !isGeneratedIntakeBrief(displayName)) {
    const headlineMatchesDisplayName = displayName === headline;
    const headlineIsGenericPlaceholder =
      isProductBrandReviewTitle(headline) &&
      headline.trim().toLowerCase() !== PRODUCT_BRAND_NAME.toLowerCase();

    if (!headlineMatchesDisplayName || !headlineIsGenericPlaceholder) {
      const normalizedDisplayName = toReviewDisplayTitle(displayName);

      if (normalizedDisplayName.length > 0) {
        return clampReviewWorkspaceH1Title(normalizedDisplayName);
      }
    }
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

/** True when the review has operator-submitted prose or intake-attached documents/diagrams. */
export function deriveHasSubmittedArchitectureDescription(run: RunSummary, headline: string): boolean {
  if (deriveSubmittedArchitectureText(run, headline) !== null) {
    return true;
  }

  const description = run.description?.trim() ?? "";

  return extractAttachedIntakeFileNames(description).length > 0;
}

export function deriveReviewOwnerLabel(run: RunDetail["run"]): string | null {
  const decisionBy = run.operatorGovernanceDecisionByUserId?.trim() ?? "";

  if (decisionBy.length > 0) {
    return decisionBy;
  }

  return null;
}

/** Buyer-facing approver on review metadata — never surfaces a raw user id as a display name. */
export const RUN_DETAIL_ARCHITECTURE_REQUEST_ID_STORED_EMPTY =
  "Architecture request id was stored empty." as const;

export function formatReviewGovernanceDecisionRecordedByDisplay(
  operatorGovernanceDecisionByUserId: string | null | undefined,
): string | null {
  if (operatorGovernanceDecisionByUserId === null || operatorGovernanceDecisionByUserId === undefined) {
    return null;
  }

  if (operatorGovernanceDecisionByUserId.length === 0) {
    return "Governance decision recorder was stored empty.";
  }

  const trimmed = operatorGovernanceDecisionByUserId.trim();

  if (trimmed.length === 0) {
    return "Governance decision recorder was stored empty.";
  }

  if (isUuidLike(trimmed)) {
    return `Approver name was not stored. Recorded-by user id ${trimmed}.`;
  }

  return trimmed;
}
export function deriveReviewTemplateLabel(
  manifestSummary: ManifestSummary | null,
): string | null {
  if (manifestSummary === null) {
    return null;
  }

  const ruleSetId = manifestSummary.ruleSetId?.trim() ?? "";
  const ruleSetVersion = manifestSummary.ruleSetVersion?.trim() ?? "";

  // Dev/in-memory rule sets are not buyer-facing template names.
  if (ruleSetId.toLowerCase() === "in-memory" || ruleSetId.toLowerCase().includes("in-memory")) {
    return null;
  }

  if (ruleSetId.length === 0 && ruleSetVersion.length === 0) {
    return null;
  }

  const label = policyPackBuyerLabel(ruleSetId, ruleSetVersion).trim();

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

  return null;
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
