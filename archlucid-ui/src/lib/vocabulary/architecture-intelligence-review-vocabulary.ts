/**
 * TB-2358 — Review workspace ≠ Architecture Intelligence vocabulary rail.
 *
 * Architecture Intelligence is a review-adjacent reasoning tool — not a second
 * product surface. The review workspace remains the package of record.
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ARCHITECTURE_INTELLIGENCE_PAGE_TITLE } from "@/lib/architecture/architecture-intelligence-page-copy";
import { createExternalPeerPairwiseVocabularyRail } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";
import type { ExternalPeerPairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ArchitectureIntelligenceReviewSurfaceId = "review-workspace" | "architecture-intelligence";

export type ArchitectureIntelligenceReviewLink = {
  readonly id: ArchitectureIntelligenceReviewSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ArchitectureIntelligenceReviewVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly reviewWorkspaceLink: ArchitectureIntelligenceReviewLink;
  readonly architectureIntelligenceLink: ArchitectureIntelligenceReviewLink;
};

export const ARCHITECTURE_INTELLIGENCE_REVIEW_HEADING =
  "Review workspace and Try another reasoning pass serve different purposes" as const;

export const ARCHITECTURE_INTELLIGENCE_REVIEW_WHY_TWO =
  "The review workspace is where you triage findings, capture evidence, and finalize the review record. Try another reasoning pass is a review-adjacent tool for exploring alternative conclusions — it does not replace the review workspace." as const;

export const ARCHITECTURE_INTELLIGENCE_REVIEW_COMPACT_LINE =
  "Review workspace is the package of record; Try another reasoning pass is an exploratory review tool." as const;

export const ARCHITECTURE_INTELLIGENCE_REVIEW_REVIEWS_PEER_LINK: ArchitectureIntelligenceReviewLink = {
  id: "review-workspace",
  label: "Reviews (open workspace)",
  href: REVIEWS_LIST_PATH,
  whenToUse: "Open an architecture review to triage findings and finalize.",
};

export const ARCHITECTURE_INTELLIGENCE_REVIEW_TOOL_LINK: ArchitectureIntelligenceReviewLink = {
  id: "architecture-intelligence",
  label: ARCHITECTURE_INTELLIGENCE_PAGE_TITLE,
  href: ARCHITECTURE_INTELLIGENCE_PATH,
  whenToUse: "Explore an alternative reasoning pass from a linked review when you need a fresh angle.",
};

/** Build run-scoped review workspace ↔ Architecture Intelligence pairwise model. */
export function buildArchitectureIntelligenceReviewPairwiseRail(
  runId?: string | null,
): ExternalPeerPairwiseVocabularyRailModel<ArchitectureIntelligenceReviewSurfaceId> {
  return createExternalPeerPairwiseVocabularyRail({
    runId,
    reviewSurfaceId: "review-workspace",
    externalSurfaceId: "architecture-intelligence",
    reviewTabId: "overview",
    copy: {
      heading: ARCHITECTURE_INTELLIGENCE_REVIEW_HEADING,
      whyTwo: ARCHITECTURE_INTELLIGENCE_REVIEW_WHY_TWO,
      compactLine: ARCHITECTURE_INTELLIGENCE_REVIEW_COMPACT_LINE,
      reviewSideLabel: "Review workspace",
      reviewSideWhenToUse: "Triage findings, capture evidence, and finalize this architecture review.",
    },
    reviewsPeerFallbackLink: ARCHITECTURE_INTELLIGENCE_REVIEW_REVIEWS_PEER_LINK,
    externalPeerLinkBase: ARCHITECTURE_INTELLIGENCE_REVIEW_TOOL_LINK,
    buildExternalPeerHref: (scopedRunId) =>
      `${ARCHITECTURE_INTELLIGENCE_PATH}?runId=${encodeURIComponent(scopedRunId)}`,
  });
}

/** Build run-scoped review workspace ↔ Architecture Intelligence vocabulary. */
export function buildArchitectureIntelligenceReviewVocabulary(
  runId?: string | null,
): ArchitectureIntelligenceReviewVocabularyModel {
  const rail = buildArchitectureIntelligenceReviewPairwiseRail(runId);

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    reviewWorkspaceLink: rail.reviewSideLink,
    architectureIntelligenceLink: rail.externalPeerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveArchitectureIntelligenceReviewPeerLink(
  currentSurfaceId: ArchitectureIntelligenceReviewSurfaceId,
  model: ArchitectureIntelligenceReviewVocabularyModel,
): ArchitectureIntelligenceReviewLink {
  if (currentSurfaceId === "review-workspace") {
    return model.architectureIntelligenceLink;
  }

  return model.reviewWorkspaceLink;
}
