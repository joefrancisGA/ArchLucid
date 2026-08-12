import { describe, expect, it } from "vitest";

import {
  ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK,
  ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE,
  ASK_ARCHITECTURE_INTELLIGENCE_HEADING,
  ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK,
  ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO,
  buildAskArchitectureIntelligenceVocabulary,
  resolveAskArchitectureIntelligencePeerLink,
} from "@/lib/vocabulary/ask-architecture-intelligence-vocabulary";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";

describe("ask-architecture-intelligence-vocabulary (TB-2313)", () => {
  it("explains signed-review Q&A vs closed-loop architecture reasoning", () => {
    const model = buildAskArchitectureIntelligenceVocabulary();

    expect(model.heading).toBe(ASK_ARCHITECTURE_INTELLIGENCE_HEADING);
    expect(model.whyTwo).toBe(ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("signed review");
    expect(model.whyTwo.toLowerCase()).toContain("closed-loop");
    expect(model.compactLine).toBe(ASK_ARCHITECTURE_INTELLIGENCE_COMPACT_LINE);

    expect(model.askReviewQuestionsLink).toEqual(ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK);
    expect(model.askReviewQuestionsLink.href).toBe(ASK_REVIEW_QUESTIONS_PATH);
    expect(model.architectureIntelligenceLink).toEqual(
      ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK,
    );
    expect(model.architectureIntelligenceLink.href).toBe(ARCHITECTURE_INTELLIGENCE_PATH);
  });

  it("resolves the peer surface from ask-review-questions and architecture-intelligence", () => {
    expect(resolveAskArchitectureIntelligencePeerLink("ask-review-questions")).toEqual(
      ASK_ARCHITECTURE_INTELLIGENCE_INTELLIGENCE_LINK,
    );

    expect(resolveAskArchitectureIntelligencePeerLink("architecture-intelligence")).toEqual(
      ASK_ARCHITECTURE_INTELLIGENCE_ASK_LINK,
    );
  });
});
