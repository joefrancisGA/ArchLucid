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

import type {
  EvidenceCoverageSummary,
  ExecutiveBottomLineContent,
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
    eyebrowLabel: "Review package",
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
