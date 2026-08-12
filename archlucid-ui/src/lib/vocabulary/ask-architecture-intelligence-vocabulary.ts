/**
 * TB-2313 — Ask review questions ≠ Architecture intelligence vocabulary rail.
 *
 * Why two surfaces exist:
 * - Ask review questions (`/insights/ask-review-questions`) answers questions
 *   about a finalized review and cites evidence from the signed review record.
 * - Architecture intelligence (`/architecture/architecture-intelligence`) runs
 *   closed-loop architecture reasoning or the golden regression harness against
 *   a free-form description.
 *
 * They stay separate because Q&A on a signed review is not the same job as
 * running closed-loop architecture reasoning. Distinct from Ask ≠ Search
 * evidence (TB-2231) and Architecture intelligence ≠ Evidence graph.
 */

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";

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
  "Ask review questions and Architecture intelligence do different jobs" as const;

export const ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO =
  "Ask review questions answers questions about a finalized review and cites evidence from the signed review record. Architecture intelligence runs closed-loop architecture reasoning or the golden regression harness against a free-form description. Asking about a signed review is not the same as running closed-loop reasoning." as const;

export const ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE =
  "Ask review questions is Q&A on a signed review; Architecture intelligence runs closed-loop reasoning — open the other when you need that job." as const;

export const ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK: AskArchitectureIntelligenceLink = {
  id: "ask-review-questions",
  label: "Ask review questions",
  href: ASK_REVIEW_QUESTIONS_PATH,
  whenToUse: "Ask questions about a finalized review with cited evidence.",
};

export const ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK: AskArchitectureIntelligenceLink = {
  id: "architecture-intelligence",
  label: "Architecture intelligence",
  href: ARCHITECTURE_INTELLIGENCE_PATH,
  whenToUse: "Run closed-loop architecture reasoning or the golden harness.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAskArchitectureIntelligenceVocabulary(): AskArchitectureIntelligenceVocabularyModel {
  return {
    heading: ASK_ARCHITECTURE_INTELLIGENCE_HEADING,
    whyTwo: ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO,
    compactLine: ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE,
    askReviewQuestionsLink: ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK,
    architectureIntelligenceLink: ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK,
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
