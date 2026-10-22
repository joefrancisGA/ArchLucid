/**
 * TB-2307 — Pilot feedback ≠ Recommendation learning vocabulary rail.
 *
 * Why two surfaces exist:
 * - Pilot feedback (`/internal/product-learning`) tracks feedback on review
 *   outputs, recurring issues, and improvement opportunities from pilots.
 * - Recommendation learning (`/internal/recommendation-learning`) inspects and
 *   rebuilds the advisory recommendation-ranking profile from historical
 *   accepted, deferred, rejected, and implemented outcomes.
 *
 * They stay separate because reading pilot outcome themes is not the same task
 * as tuning recommendation-ranking weights.
 */

import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PilotFeedbackRecommendationLearningSurfaceId =
  | "pilot-feedback"
  | "recommendation-learning";

export type PilotFeedbackRecommendationLearningLink = {
  readonly id: PilotFeedbackRecommendationLearningSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PilotFeedbackRecommendationLearningVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly pilotFeedbackLink: PilotFeedbackRecommendationLearningLink;
  readonly recommendationLearningLink: PilotFeedbackRecommendationLearningLink;
};

export const PILOT_FEEDBACK_RECOMMENDATION_LEARNING_HEADING =
  "Pilot feedback and Recommendation learning serve different purposes" as const;

export const PILOT_FEEDBACK_RECOMMENDATION_LEARNING_WHY_TWO =
  "Pilot feedback tracks feedback on review outputs, recurring issues, and improvement opportunities from pilots. Recommendation learning inspects and rebuilds the advisory recommendation-ranking profile from historical outcomes. Reading pilot themes is not the same as tuning recommendation weights." as const;

export const PILOT_FEEDBACK_RECOMMENDATION_LEARNING_COMPACT_LINE =
  "Pilot feedback is outcome themes; Recommendation learning tunes ranking weights." as const;

export const PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK: PilotFeedbackRecommendationLearningLink =
  {
    id: "pilot-feedback",
    label: "Pilot feedback",
    href: PRODUCT_LEARNING_PATH,
    whenToUse:
      "Track pilot feedback, recurring issues, and improvement opportunities on review outputs.",
  };

export const PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK: PilotFeedbackRecommendationLearningLink =
  {
    id: "recommendation-learning",
    label: "Recommendation learning",
    href: RECOMMENDATION_LEARNING_CANONICAL_PATH,
    whenToUse:
      "Inspect and rebuild the advisory recommendation-ranking profile from historical outcomes.",
  };

/** Pairwise model for Pilot feedback ↔ Recommendation learning (fixed routes). */
export function buildPilotFeedbackRecommendationLearningPairwiseRail(): PairwiseVocabularyRailModel<PilotFeedbackRecommendationLearningSurfaceId> {
  return {
    heading: PILOT_FEEDBACK_RECOMMENDATION_LEARNING_HEADING,
    whyTwo: PILOT_FEEDBACK_RECOMMENDATION_LEARNING_WHY_TWO,
    compactLine: PILOT_FEEDBACK_RECOMMENDATION_LEARNING_COMPACT_LINE,
    currentLink: PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK,
    peerLink: PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildPilotFeedbackRecommendationLearningVocabulary(): PilotFeedbackRecommendationLearningVocabularyModel {
  const rail = buildPilotFeedbackRecommendationLearningPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    pilotFeedbackLink: rail.currentLink,
    recommendationLearningLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePilotFeedbackRecommendationLearningPeerLink(
  currentSurfaceId: PilotFeedbackRecommendationLearningSurfaceId,
): PilotFeedbackRecommendationLearningLink {
  if (currentSurfaceId === "pilot-feedback") {
    return PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK;
  }

  return PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK;
}
