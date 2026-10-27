import { formatRunListTitleWithDisambiguator } from "@/lib/operator/run-home-list-disambiguator";
import { resolveSystemNotJobWorkingPrimaryListTitle } from "@/lib/system-not-job-run-id-not-in-working-primary-chrome";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import {
  getBuyerSafeReviewsTableLinkForRun,
  type PrimaryReviewExploreLink,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isSampleReviewRun } from "@/lib/reviews/is-sample-review-run";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { formatRelativeTime } from "@/lib/relative-time";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  lookupArchitectureDraftParentArchitectureId,
  reviewPackageArchitectureName,
  reviewPackageOwnerLabel,
  type ReviewPackageOwnerResolutionContext,
} from "@/lib/review-package-validation-picker";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";
import {
  WORKING_UNLINKED_REVIEW_INBOX_LABEL,
  isUnlinkedArchitectureReviewJob,
} from "@/lib/architecture/working-unlinked-review-honesty";
import type { RunSummary } from "@/types/authority";

import {
  reviewsHubLifecycleStage,
  reviewsHubNeedsAttention,
  reviewsHubOverallStatus,
  type ReviewsHubLifecycleStageDisplay,
  type ReviewsHubOverallStatusDisplay,
} from "./reviews-hub-review-status";

export type ReviewsHubReviewRowDisplay = {
  readonly runId: string;
  readonly reviewTitle: string;
  readonly reviewTitlePrimary: string;
  readonly reviewTitleKindLabel: string | null;
  readonly architectureName: string;
  readonly overallStatus: ReviewsHubOverallStatusDisplay;
  readonly lifecycleStage: ReviewsHubLifecycleStageDisplay;
  readonly ownerLabel: string;
  readonly lastUpdated: string;
  readonly lastUpdatedAbsolute: string;
  readonly lastUpdatedKind: "created" | "finalized";
  readonly findingsCount: number | null;
  readonly riskCount: number | null;
  readonly evidenceCount: number | null;
  readonly governanceState: string;
  readonly needsAttention: boolean;
  readonly primaryAction: PrimaryReviewExploreLink;
  readonly reviewHref: string;
  readonly architectureId: string | null;
  readonly architectureDeskHref: string | null;
  readonly isSampleReview: boolean;
};

/** @deprecated Use {@link ReviewsHubReviewRowDisplay}. */
export type ReviewsHubPackageRowDisplay = ReviewsHubReviewRowDisplay;

export type ReviewsHubRowDisplayOptions = {
  readonly isWorkingMode?: boolean;
};

function resolveReviewsHubRowArchitectureId(
  run: RunSummary,
  ownerContext: ReviewPackageOwnerResolutionContext,
): string | null {
  const fromRegistry = lookupArchitectureDraftParentArchitectureId(
    run.runId,
    ownerContext.draftRegistryEntries,
  );

  if (fromRegistry !== null) {
    return fromRegistry;
  }

  const requestId = run.requestId?.trim() ?? "";

  if (requestId.length > 0) {
    return requestId;
  }

  return null;
}

function resolveReviewsHubReviewHref(
  run: RunSummary,
  primaryAction: PrimaryReviewExploreLink,
  options: ReviewsHubRowDisplayOptions,
  ownerContext: ReviewPackageOwnerResolutionContext,
): string {
  if (options.isWorkingMode !== true) {
    return primaryAction.href;
  }

  const architectureId = resolveReviewsHubRowArchitectureId(run, ownerContext);

  if (architectureId === null) {
    return primaryAction.href;
  }

  return resolveWorkingInhabitedFindingsLandingHref({
    runId: run.runId,
    architectureId,
    requestId: run.requestId,
    draftRegistryEntries: ownerContext.draftRegistryEntries,
    workingMode: true,
  });
}

function resolveReviewsHubArchitectureDisplayName(
  run: RunSummary,
  architectureId: string | null,
  isWorkingMode: boolean,
): string {
  if (isWorkingMode && isUnlinkedArchitectureReviewJob(architectureId)) {
    return WORKING_UNLINKED_REVIEW_INBOX_LABEL;
  }

  return reviewPackageArchitectureName(run);
}

function storedFiniteCount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

function resolveReviewsHubRecencyInstant(run: RunSummary): { readonly kind: "created" | "finalized"; readonly instantUtc: string } {
  if (run.hasGoldenManifest === true) {
    const completedUtc = run.completedUtc?.trim() ?? "";

    if (completedUtc.length > 0) {
      return { kind: "finalized", instantUtc: completedUtc };
    }
  }

  return { kind: "created", instantUtc: run.createdUtc };
}

function formatLastUpdated(run: RunSummary): string {
  const recency = resolveReviewsHubRecencyInstant(run);

  if (
    isStaticDemoPayloadFallbackEnabled() ||
    canonicalizeDemoRunId(run.runId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
  ) {
    return new Date(recency.instantUtc).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return formatRelativeTime(recency.instantUtc);
}

function formatLastUpdatedAbsolute(run: RunSummary): string {
  const recency = resolveReviewsHubRecencyInstant(run);
  const parsed = new Date(recency.instantUtc);

  if (Number.isNaN(parsed.getTime())) {
    return recency.instantUtc;
  }

  const formatted = parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return recency.kind === "finalized" ? `Finalized ${formatted}` : `Created ${formatted}`;
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

  const storedDecision = run.operatorGovernanceDecision?.trim() ?? "";

  if (storedDecision.length > 0) {
    return storedDecision;
  }

  if (run.hasGoldenManifest === undefined) {
    return "Package state was not stored.";
  }

  if (run.hasGoldenManifest !== true) {
    return "Not submitted";
  }

  if (run.hasGovernanceWarnings === true) {
    return "Monitoring (governance warnings)";
  }

  if (run.hasGovernanceWarnings === false) {
    return "No governance warnings were stored. An approval decision was not stored.";
  }

  return "Governance outcome was not stored.";
}

function reviewEvidenceCount(run: RunSummary): number | null {
  const artifacts = storedFiniteCount(run.artifactCount);

  if (artifacts !== null) {
    return artifacts;
  }

  return null;
}

function reviewFindingCount(run: RunSummary): number | null {
  return storedFiniteCount(run.findingCount);
}

function reviewRiskCount(run: RunSummary): number | null {
  return storedFiniteCount(run.warningCount);
}

/** Row presentation model for the `/architecture/reviews` hub inventory. */
export function toReviewsHubReviewRowDisplay(
  run: RunSummary,
  ownerContext: ReviewPackageOwnerResolutionContext = {},
  siblingRuns: readonly RunSummary[] = [],
  options: ReviewsHubRowDisplayOptions = {},
): ReviewsHubReviewRowDisplay {
  const runId = canonicalizeDemoRunId(run.runId);
  const primaryAction = getBuyerSafeReviewsTableLinkForRun(run);
  const architectureId = resolveReviewsHubRowArchitectureId(run, ownerContext);
  const reviewHref = resolveReviewsHubReviewHref(run, primaryAction, options, ownerContext);
  const reviewTitle = buyerFacingReviewTitleFromSummary(run);
  const titleParts = splitReviewsHubReviewTitle(reviewTitle);
  const reviewTitlePrimary =
    siblingRuns.length > 1
      ? options.isWorkingMode === true
        ? resolveSystemNotJobWorkingPrimaryListTitle(run, siblingRuns)
        : formatRunListTitleWithDisambiguator(run, siblingRuns)
      : titleParts.primary;
  const workingPrimaryAction =
    options.isWorkingMode === true && reviewHref !== primaryAction.href
      ? { ...primaryAction, href: reviewHref }
      : primaryAction;

  return {
    runId,
    reviewTitle,
    reviewTitlePrimary,
    reviewTitleKindLabel: titleParts.kindLabel,
    architectureName: resolveReviewsHubArchitectureDisplayName(
      run,
      architectureId,
      options.isWorkingMode === true,
    ),
    overallStatus: reviewsHubOverallStatus(run),
    lifecycleStage: reviewsHubLifecycleStage(run),
    ownerLabel: reviewPackageOwnerLabel(run, ownerContext),
    lastUpdated: formatLastUpdated(run),
    lastUpdatedAbsolute: formatLastUpdatedAbsolute(run),
    lastUpdatedKind: resolveReviewsHubRecencyInstant(run).kind,
    findingsCount: reviewFindingCount(run),
    riskCount: reviewRiskCount(run),
    evidenceCount: reviewEvidenceCount(run),
    governanceState: reviewGovernanceState(run),
    needsAttention: reviewsHubNeedsAttention(run),
    primaryAction: workingPrimaryAction,
    reviewHref,
    architectureId,
    architectureDeskHref:
      architectureId !== null ? architectureIdentityPath(architectureId) : null,
    isSampleReview: isSampleReviewRun(run),
  };
}

/** @deprecated Use {@link toReviewsHubReviewRowDisplay}. */
export const toReviewsHubPackageRowDisplay = toReviewsHubReviewRowDisplay;
