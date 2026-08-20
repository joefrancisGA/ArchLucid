/**
 * TB-2238 — Planning ≠ reviews vocabulary rail.
 *
 * Why two surfaces exist:
 * - Improvement planning (`/insights/improvement-planning`) derives themes and
 *   plans from review feedback — it is not a place to start or list reviews.
 * - Architecture reviews (`/architecture/reviews`) is the hub for architecture
 *   packages and review inventory.
 *
 * They stay separate because planning is derived insight work; reviews are the
 * package lifecycle. Operators need both surfaces with deep links so they do
 * not treat planning as the reviews hub (or the reverse).
 */

import { PLANNING_PATH } from "@/lib/planning-route";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export const ARCHITECTURE_REVIEWS_HUB_PATH = "/architecture/reviews" as const;

export type PlanningReviewsSurfaceId = "improvement-planning" | "architecture-reviews";

export type PlanningReviewsLink = {
  readonly id: PlanningReviewsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PlanningReviewsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly planningLink: PlanningReviewsLink;
  readonly reviewsLink: PlanningReviewsLink;
};

export const PLANNING_REVIEWS_HEADING = "Planning and reviews serve different purposes" as const;

export const PLANNING_REVIEWS_WHY_TWO =
  "Improvement planning derives themes and plans from review feedback across architecture packages. Architecture reviews is the hub for starting and managing architecture packages. Planning does not replace the reviews inventory." as const;

export const PLANNING_REVIEWS_COMPACT_LINE =
  "Planning derives improvement themes; Reviews manage architecture packages — open the other when you need both." as const;

export const PLANNING_REVIEWS_PLANNING_LINK: PlanningReviewsLink = {
  id: "improvement-planning",
  label: "Improvement planning",
  href: PLANNING_PATH,
  whenToUse: "Review derived themes and plans from architecture package feedback.",
};

export const PLANNING_REVIEWS_REVIEWS_LINK: PlanningReviewsLink = {
  id: "architecture-reviews",
  label: "Architecture reviews",
  href: ARCHITECTURE_REVIEWS_HUB_PATH,
  whenToUse: "Start or open architecture packages and review inventory.",
};

/** Pairwise model for Improvement planning ↔ Architecture reviews (fixed routes). */
export function buildPlanningReviewsPairwiseRail(): PairwiseVocabularyRailModel<PlanningReviewsSurfaceId> {
  return {
    heading: PLANNING_REVIEWS_HEADING,
    whyTwo: PLANNING_REVIEWS_WHY_TWO,
    compactLine: PLANNING_REVIEWS_COMPACT_LINE,
    currentLink: PLANNING_REVIEWS_PLANNING_LINK,
    peerLink: PLANNING_REVIEWS_REVIEWS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPlanningReviewsVocabulary(): PlanningReviewsVocabularyModel {
  const rail = buildPlanningReviewsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    planningLink: rail.currentLink,
    reviewsLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePlanningReviewsPeerLink(
  currentSurfaceId: PlanningReviewsSurfaceId,
): PlanningReviewsLink {
  if (currentSurfaceId === "improvement-planning") {
    return PLANNING_REVIEWS_REVIEWS_LINK;
  }

  return PLANNING_REVIEWS_PLANNING_LINK;
}
