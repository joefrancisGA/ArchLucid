import { formatRunListTitleWithDisambiguator } from "@/lib/operator/run-home-list-disambiguator";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import {
  getBuyerSafeReviewsTableLinkForRun,
  type PrimaryReviewExploreLink,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { formatRelativeTime } from "@/lib/relative-time";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { reviewPackageArchitectureName, reviewPackageOwnerLabel, type ReviewPackageOwnerResolutionContext } from "@/lib/review-package-validation-picker";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import {
  reviewsHubLifecycleStage,
  reviewsHubNeedsAttention,
  reviewsHubOverallStatus,
  type ReviewsHubLifecycleStage,
  type ReviewsHubOverallStatus,
} from "./reviews-hub-review-status";

export type ReviewsHubReviewRowDisplay = {
  readonly runId: string;
  readonly reviewTitle: string;
  readonly reviewTitlePrimary: string;
  readonly reviewTitleKindLabel: string | null;
  readonly architectureName: string;
  readonly overallStatus: ReviewsHubOverallStatus;
  readonly lifecycleStage: ReviewsHubLifecycleStage;
  readonly ownerLabel: string;
  readonly lastUpdated: string;
  readonly lastUpdatedAbsolute: string;
  readonly findingsCount: number;
  readonly riskCount: number;
  readonly evidenceCount: number;
  readonly governanceState: string;
  readonly needsAttention: boolean;
  readonly primaryAction: PrimaryReviewExploreLink;
  readonly reviewHref: string;
  readonly isSampleReview: boolean;
};

/** @deprecated Use {@link ReviewsHubReviewRowDisplay}. */
export type ReviewsHubPackageRowDisplay = ReviewsHubReviewRowDisplay;

function finiteCount(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function formatLastUpdated(run: RunSummary): string {
  if (
    isStaticDemoPayloadFallbackEnabled() ||
    canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
  ) {
    return new Date(run.createdUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return formatRelativeTime(run.createdUtc);
}

function formatLastUpdatedAbsolute(run: RunSummary): string {
  const parsed = new Date(run.createdUtc);

  if (Number.isNaN(parsed.getTime())) {
    return run.createdUtc;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const ARCHITECTURE_REVIEW_PACKET_TITLE_PREFIX = /^Architecture Review Packet:\s*(.+)$/i;

function splitReviewsHubReviewTitle(title: string): { primary: string; kindLabel: string | null } {
  const packetMatch = ARCHITECTURE_REVIEW_PACKET_TITLE_PREFIX.exec(title.trim());

  if (packetMatch !== null) {
    return {
      primary: packetMatch[1].trim(),
      kindLabel: "Architecture review packet",
    };
  }

  return {
    primary: title,
    kindLabel: null,
  };
}

function reviewGovernanceState(run: RunSummary): string {
  const demoMeta = buyerDemoPackageCardMeta(run.runId);

  if (demoMeta !== null) {
    if (demoMeta.lastAuditEvent.toLowerCase().includes("approval")) {
      return "Approved";
    }

    if (demoMeta.decisionSummary.toLowerCase().includes("in progress")) {
      return "Pending approval";
    }
  }

  if (run.hasGoldenManifest !== true) {
    return "Not submitted";
  }

  if (run.hasGovernanceWarnings === true) {
    return "Monitoring";
  }

  return "Ready for governance";
}

function reviewEvidenceCount(run: RunSummary): number {
  const artifacts = finiteCount(run.artifactCount);

  if (artifacts > 0) {
    return artifacts;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return 4;
  }

  let score = 0;

  if (run.hasContextSnapshot === true) {
    score += 1;
  }

  if (run.hasGraphSnapshot === true) {
    score += 1;
  }

  if (run.hasFindingsSnapshot === true) {
    score += 1;
  }

  if (run.hasGoldenManifest === true) {
    score += 1;
  }

  return score;
}

function reviewFindingCount(run: RunSummary): number {
  const wire = finiteCount(run.findingCount);

  if (wire > 0) {
    return wire;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount;
  }

  return run.hasFindingsSnapshot === true ? 1 : 0;
}

function reviewRiskCount(run: RunSummary): number {
  const wire = finiteCount(run.warningCount);

  if (wire > 0) {
    return wire;
  }

  if (canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount;
  }

  return run.hasWarnings === true || run.hasGovernanceWarnings === true ? 1 : 0;
}

/** Row presentation model for the `/architecture/reviews` hub inventory. */
export function toReviewsHubReviewRowDisplay(
  run: RunSummary,
  ownerContext: ReviewPackageOwnerResolutionContext = {},
  siblingRuns: readonly RunSummary[] = [],
): ReviewsHubReviewRowDisplay {
  const runId = canonicalizeDemoRunId(run.runId);
  const primaryAction = getBuyerSafeReviewsTableLinkForRun(run);
  const reviewTitle = buyerFacingReviewTitleFromSummary(run);
  const titleParts = splitReviewsHubReviewTitle(reviewTitle);
  const reviewTitlePrimary =
    siblingRuns.length > 1
      ? formatRunListTitleWithDisambiguator(run, siblingRuns)
      : titleParts.primary;

  return {
    runId,
    reviewTitle,
    reviewTitlePrimary,
    reviewTitleKindLabel: titleParts.kindLabel,
    architectureName: reviewPackageArchitectureName(run),
    overallStatus: reviewsHubOverallStatus(run),
    lifecycleStage: reviewsHubLifecycleStage(run),
    ownerLabel: reviewPackageOwnerLabel(run, ownerContext),
    lastUpdated: formatLastUpdated(run),
    lastUpdatedAbsolute: formatLastUpdatedAbsolute(run),
    findingsCount: reviewFindingCount(run),
    riskCount: reviewRiskCount(run),
    evidenceCount: reviewEvidenceCount(run),
    governanceState: reviewGovernanceState(run),
    needsAttention: reviewsHubNeedsAttention(run),
    primaryAction,
    reviewHref: primaryAction.href,
    isSampleReview:
      run.isSample === true ||
      runId === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID) ||
      run.isDemoWelcomeRun === true,
  };
}

/** @deprecated Use {@link toReviewsHubReviewRowDisplay}. */
export const toReviewsHubPackageRowDisplay = toReviewsHubReviewRowDisplay;
