import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecommendationLearningEvidenceOrientationStrip } from "@/app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningEvidenceOrientationStrip";
import {
  RECOMMENDATION_LEARNING_CANONICAL_PATH,
  RECOMMENDATION_LEARNING_SOURCES,
} from "@/lib/recommendation-learning-evidence-copy";

describe("RecommendationLearningEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking recommendation learning", () => {
    render(<RecommendationLearningEvidenceOrientationStrip />);

    expect(screen.getByTestId("recommendation-learning-sources")).toBeInTheDocument();
    expect(screen.getByTestId("recommendation-learning-claim-discipline")).toBeInTheDocument();

    for (const link of RECOMMENDATION_LEARNING_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      RECOMMENDATION_LEARNING_SOURCES.some((link) => link.href === RECOMMENDATION_LEARNING_CANONICAL_PATH),
    ).toBe(false);
  });
});
