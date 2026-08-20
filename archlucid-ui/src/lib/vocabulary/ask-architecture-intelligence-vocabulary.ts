/**
 * TB-2313 — Ask review questions ≠ Architecture intelligence vocabulary rail.
 *
 * Why two surfaces exist:
 * - Ask review questions (`/insights/ask-review-questions`) answers questions
 *   about a finalized review and cites evidence from the sealed review record.
 * - Try another reasoning pass (`/architecture/architecture-intelligence`) explores
 *   alternative architecture conclusions from a free-form description.
 *
 * They stay separate because Q&A on a signed review is not the same task as
 * running closed-loop architecture reasoning. Distinct from Ask ≠ Search
 * evidence (TB-2231) and Architecture intelligence ≠ Evidence graph.
 */

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type AskArchitectureIntelligenceSurfaceId =
  | "ask-review-questions"
  | "architecture-intelligence";

export type AskArchitectureIntelligenceLink = {
  readonly id: AskArchitectureIntelligenceSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AskArchitectureIntelligenceVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly askReviewQuestionsLink: AskArchitectureIntelligenceLink;
  readonly architectureIntelligenceLink: AskArchitectureIntelligenceLink;
};

export const ASK_ARCHITECTURE_INTELLIGENCE_HEADING =
  "Ask review questions and Try another reasoning pass serve different purposes" as const;

export const ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO =
  "Ask review questions answers questions about a finalized review and cites evidence from the sealed review record. Try another reasoning pass explores alternative architecture conclusions from a free-form description — not Q&A on a signed review." as const;

export const ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE =
  "Ask review questions is Q&A on a signed review; Try another reasoning pass is an exploratory reasoning tool." as const;

export const ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK: AskArchitectureIntelligenceLink = {
  id: "ask-review-questions",
  label: "Ask review questions",
  href: ASK_REVIEW_QUESTIONS_PATH,
  whenToUse: "Ask questions about a finalized review with cited evidence.",
};

export const ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK: AskArchitectureIntelligenceLink = {
  id: "architecture-intelligence",
  label: "Try another reasoning pass",
  href: ARCHITECTURE_INTELLIGENCE_PATH,
  whenToUse:
    "Open from a linked review, draft refine, or findings action to explore an alternative reasoning pass.",
};

/** Pairwise model for Ask review questions ↔ Architecture intelligence (fixed routes). */
export function buildAskArchitectureIntelligencePairwiseRail(): PairwiseVocabularyRailModel<AskArchitectureIntelligenceSurfaceId> {
  return {
    heading: ASK_ARCHITECTURE_INTELLIGENCE_HEADING,
    whyTwo: ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO,
    compactLine: ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE,
    currentLink: ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK,
    peerLink: ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAskArchitectureIntelligenceVocabulary(): AskArchitectureIntelligenceVocabularyModel {
  const rail = buildAskArchitectureIntelligencePairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    askReviewQuestionsLink: rail.currentLink,
    architectureIntelligenceLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAskArchitectureIntelligencePeerLink(
  currentSurfaceId: AskArchitectureIntelligenceSurfaceId,
): AskArchitectureIntelligenceLink {
  if (currentSurfaceId === "ask-review-questions") {
    return ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK;
  }

  return ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK;
}
