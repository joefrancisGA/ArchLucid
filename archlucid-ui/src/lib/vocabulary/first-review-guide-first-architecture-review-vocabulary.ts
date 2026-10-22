/**
 * TB-2323 — First review guide hub ≠ First architecture review help.
 *
 * Why two surfaces exist:
 * - First review guide (`/architecture/first-review-guide`) is the in-product
 *   checklist hub with readiness, walkthrough steps, and next actions.
 * - Your first architecture review (`/help/first-architecture-review`) is the
 *   help-center guided path for completing a first review end-to-end.
 *
 * They stay separate because the in-product checklist is not the same task as
 * the help-topic guided path. Distinct from Getting started ≠ First architecture
 * review (TB-2312) and the Pilot guide triad (TB-2322).
 */

import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type FirstReviewGuideFirstArchitectureReviewSurfaceId =
  | "first-review-guide"
  | "first-architecture-review";

export type FirstReviewGuideFirstArchitectureReviewLink = {
  readonly id: FirstReviewGuideFirstArchitectureReviewSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type FirstReviewGuideFirstArchitectureReviewVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly firstReviewGuideLink: FirstReviewGuideFirstArchitectureReviewLink;
  readonly firstArchitectureReviewLink: FirstReviewGuideFirstArchitectureReviewLink;
};

export const FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HEADING =
  "First review guide and Your first architecture review serve different purposes" as const;

export const FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_WHY_TWO =
  "First review guide is the in-product checklist hub with readiness, walkthrough steps, and next actions. Your first architecture review is the help-center guided path for completing a first review end-to-end. The in-product checklist is not the same task as the help-topic guided path." as const;

export const FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE =
  "First review guide is the in-product checklist; Your first architecture review is the help guided path." as const;

export const FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK: FirstReviewGuideFirstArchitectureReviewLink =
  {
    id: "first-review-guide",
    label: "First review guide",
    href: FIRST_REVIEW_GUIDE_PATH,
    whenToUse: "Follow the in-product checklist, readiness, and next actions.",
  };

export const FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK: FirstReviewGuideFirstArchitectureReviewLink =
  {
    id: "first-architecture-review",
    label: "Your first architecture review",
    href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    whenToUse: "Follow the help-center guided path to complete your first review.",
  };

/** Pairwise model for First review guide ↔ Your first architecture review (fixed routes). */
export function buildFirstReviewGuideFirstArchitectureReviewPairwiseRail(): PairwiseVocabularyRailModel<FirstReviewGuideFirstArchitectureReviewSurfaceId> {
  return {
    heading: FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HEADING,
    whyTwo: FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_WHY_TWO,
    compactLine: FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE,
    currentLink: FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK,
    peerLink: FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildFirstReviewGuideFirstArchitectureReviewVocabulary(): FirstReviewGuideFirstArchitectureReviewVocabularyModel {
  const rail = buildFirstReviewGuideFirstArchitectureReviewPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    firstReviewGuideLink: rail.currentLink,
    firstArchitectureReviewLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveFirstReviewGuideFirstArchitectureReviewPeerLink(
  currentSurfaceId: FirstReviewGuideFirstArchitectureReviewSurfaceId,
): FirstReviewGuideFirstArchitectureReviewLink {
  if (currentSurfaceId === "first-review-guide") {
    return FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK;
  }

  return FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK;
}
