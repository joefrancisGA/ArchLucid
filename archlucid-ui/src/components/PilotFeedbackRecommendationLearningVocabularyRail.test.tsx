import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotFeedbackRecommendationLearningVocabularyRail } from "@/components/PilotFeedbackRecommendationLearningVocabularyRail";
import {
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_COMPACT_LINE,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_HEADING,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK,
  PILOT_FEEDBACK_RECOMMENDATION_LEARNING_WHY_TWO,
} from "@/lib/vocabulary/pilot-feedback-recommendation-learning-vocabulary";

describe("PilotFeedbackRecommendationLearningVocabularyRail (TB-2307)", () => {
  it("renders pilot-feedback strip with peer link to recommendation learning", () => {
    render(
      <PilotFeedbackRecommendationLearningVocabularyRail currentSurfaceId="pilot-feedback" />,
    );

    const strip = screen.getByTestId("pilot-feedback-recommendation-learning-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "pilot-feedback");
    expect(strip.textContent ?? "").toContain(
      PILOT_FEEDBACK_RECOMMENDATION_LEARNING_COMPACT_LINE,
    );

    const peer = screen.getByTestId(
      "pilot-feedback-recommendation-learning-vocabulary-peer-link",
    );
    expect(peer).toHaveTextContent(
      PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK.label,
    );
    expect(peer).toHaveAttribute(
      "href",
      PILOT_FEEDBACK_RECOMMENDATION_LEARNING_RECOMMENDATION_LINK.href,
    );
  });

  it("renders recommendation-learning strip with peer link to pilot feedback", () => {
    render(
      <PilotFeedbackRecommendationLearningVocabularyRail currentSurfaceId="recommendation-learning" />,
    );

    const peer = screen.getByTestId(
      "pilot-feedback-recommendation-learning-vocabulary-peer-link",
    );
    expect(peer).toHaveTextContent(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK.label);
    expect(peer).toHaveAttribute("href", PILOT_FEEDBACK_RECOMMENDATION_LEARNING_PILOT_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PilotFeedbackRecommendationLearningVocabularyRail
        currentSurfaceId="pilot-feedback"
        variant="full"
      />,
    );

    expect(
      screen.getByText(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_HEADING),
    ).toBeInTheDocument();
    expect(
      screen.getByText(PILOT_FEEDBACK_RECOMMENDATION_LEARNING_WHY_TWO),
    ).toBeInTheDocument();
  });
});
