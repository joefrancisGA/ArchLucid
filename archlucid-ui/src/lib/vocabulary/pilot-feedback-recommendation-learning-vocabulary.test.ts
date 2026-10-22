import { describe, expect, it } from "vitest";

import {
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_COMPACT_LINE,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_HEADING,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_WHY_TWO,
  buildPilotFeedbackRecommendationLearningVocabulary,
  resolvePilotFeedbackRecommendationLearningPeerLink,
} from "@/lib/vocabulary/pilot-feedback-recommendation-learning-vocabulary";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

describe("pilot-feedback-recommendation-learning-vocabulary (TB-2307)", () => {
  it("explains pilot feedback themes vs recommendation ranking weights", () => {
    const model = buildPilotFeedbackRecommendationLearningVocabulary();

    expect(model.heading).toBe(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_HEADING);
    expect(model.whyTwo).toBe(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("pilot");
    expect(model.whyTwo.toLowerCase()).toContain("ranking");
    expect(model.compactLine).toBe(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_COMPACT_LINE);

    expect(model.pilotFeedbackLink).toEqual(
      PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK,
    );
    expect(model.pilotFeedbackLink.href).toBe(PRODUCT_LEARNING_PATH);
    expect(model.recommendationLearningLink).toEqual(
      PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK,
    );
    expect(model.recommendationLearningLink.href).toBe(
      RECOMMENDATION_LEARNING_CANONICAL_PATH,
    );
  });

  it("resolves the peer surface from pilot-feedback and recommendation-learning", () => {
    expect(resolvePilotFeedbackRecommendationLearningPeerLink("pilot-feedback")).toEqual(
      PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK,
    );

    expect(
      resolvePilotFeedbackRecommendationLearningPeerLink("recommendation-learning"),
    ).toEqual(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK);
  });
});
