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
import {
  isGeneratedIntakeBrief,
  isUnusableReviewTitleCandidate,
  stripInlineMarkdownFromReviewText,
  toReviewDisplayTitle,
} from "@/lib/review-display-title";
import {
  isQualityRejectedRunStatus,
  resolveExecutionFailedWorkspaceStatusLabel,
  resolveQualityRejectedWorkspaceStatusLabel,
} from "@/lib/execution-vs-quality-outcome-copy";
import type { ManifestSummary, RunDetail, RunSummary } from "@/types/authority";

const PRODUCT_BRAND_NAME = "ArchLucid";

import type {
  EvidenceCoverageSummary,
  SponsorBottomLineContent,
  ReviewHeaderPresentation,
  ReviewStatusSummary,
  RunDetailWorkspaceRecommendedAction
} from "./types";
import { derivePrimaryConcernFinding } from "./finding-metrics";
import { countOpenFindings } from "./finding-metrics";
import { deriveHighestUnresolvedSeverityLabel } from "./finding-metrics";
import { countFindingsAwaitingAction } from "./finding-metrics";
import { derivePrimaryConcernLabel } from "./finding-metrics";
import { filterUnresolvedFindings } from "./finding-metrics";
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
export function deriveSponsorBottomLineContent(input: {
  readonly governanceDecisionLabel: string;
  readonly governanceDecisionRationale: string | null | undefined;
  readonly overallPosture: string;
  readonly blockingFindingCount: number;
  readonly highestSeverity: string | null;
  readonly themeSummaries: readonly string[] | null | undefined;
}): SponsorBottomLineContent | null {
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

function isUsableReviewTitle(title: string): boolean {
  return title.length > 0 && !isProductBrandReviewTitle(title) && !isUnusableReviewTitleCandidate(title);
}

/** Buyer-facing review workspace H1: architecture name plus the word "review". */
function formatReviewPageH1Title(architectureName: string): string {
  const normalized = stripInlineMarkdownFromReviewText(architectureName).trim();

  if (normalized.length === 0) {
    return "Architecture review";
  }

  const lower = normalized.toLowerCase();

  if (lower.endsWith(" review")) {
    return normalized;
  }

  return `${normalized} review`;
}

function resolveReviewHeaderEyebrow(reviewTitle: string, h1Title: string): string {
  if (!isUsableReviewTitle(reviewTitle)) {
    return "Architecture review";
  }

  const normalizedH1 = stripInlineMarkdownFromReviewText(h1Title).toLowerCase();
  const normalizedEyebrow = stripInlineMarkdownFromReviewText(reviewTitle).toLowerCase();

  if (normalizedEyebrow === normalizedH1 || normalizedH1.startsWith(normalizedEyebrow)) {
    return "Architecture review";
  }

  return reviewTitle;
}

export function deriveReviewHeaderPresentation(input: {
  readonly reviewTitle: string;
  readonly systemName: string | null;
  readonly runId: string;
  readonly templateLabel?: string | null;
  readonly manifestId?: string | null;
}): ReviewHeaderPresentation {
  const reviewTitle = input.reviewTitle.trim();
  const rawSystemName = input.systemName?.trim() ?? "";
  const systemName =
    rawSystemName.length > 0 && !isUnusableReviewTitleCandidate(rawSystemName) ? rawSystemName : "";
  const templateLabel = input.templateLabel?.trim() ?? "";
  const hasManifest = (input.manifestId ?? "").trim().length > 0;
  const runId = input.runId.trim();

  if (systemName.length > 0) {
    const h1Title = formatReviewPageH1Title(systemName);

    return {
      h1Title,
      eyebrowLabel: resolveReviewHeaderEyebrow(reviewTitle, h1Title),
      reviewIdentifierLabel: runId,
    };
  }

  if (isUsableReviewTitle(reviewTitle)) {
    return {
      h1Title: formatReviewPageH1Title(reviewTitle),
      eyebrowLabel: "Architecture review",
      reviewIdentifierLabel: runId,
    };
  }

  if (hasManifest && templateLabel.length > 0) {
    return {
      h1Title: formatReviewPageH1Title(templateLabel),
      eyebrowLabel: "Architecture review",
      reviewIdentifierLabel: runId,
    };
  }

  if (reviewTitle.length > 0 && !isUnusableReviewTitleCandidate(reviewTitle)) {
    return {
      h1Title: formatReviewPageH1Title(reviewTitle),
      eyebrowLabel: "Architecture review",
      reviewIdentifierLabel: runId,
    };
  }

  return {
    h1Title: "Architecture review",
    eyebrowLabel: "Architecture review",
    reviewIdentifierLabel: runId,
  };
}
export function derivePackageVersionLabel(
  manifestSummary: ManifestSummary | null,
  _manifestId?: string | null | undefined,
): string | null {
  const version = manifestSummary?.ruleSetVersion?.trim() ?? "";

  return version.length > 0 ? version : null;
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
