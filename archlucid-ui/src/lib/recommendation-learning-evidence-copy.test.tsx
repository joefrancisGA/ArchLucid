import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { RecommendationLearningEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  RECOMMENDATION_LEARNING_CANONICAL_PATH,
  RECOMMENDATION_LEARNING_FOLLOW_UPS_TITLE,
  RECOMMENDATION_LEARNING_SOURCES,
  RECOMMENDATION_LEARNING_SOURCES_INTRO,
} from "@/lib/recommendation-learning-evidence-copy";

describe("recommendation-learning-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(RECOMMENDATION_LEARNING_CANONICAL_PATH).toBe("/internal/recommendation-learning");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<RecommendationLearningEvidenceOrientationStrip />);

    expect(screen.queryByTestId("recommendation-learning-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(RECOMMENDATION_LEARNING_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("recommendation-learning-sources");

    for (const link of RECOMMENDATION_LEARNING_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${RECOMMENDATION_LEARNING_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<RecommendationLearningEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: RECOMMENDATION_LEARNING_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
