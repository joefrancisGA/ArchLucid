import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningReviewsVocabularyRail } from "@/components/PlanningReviewsVocabularyRail";
import {
  PLANNING_REVIEWS_COMPACT_LINE,
  PLANNING_REVIEWS_HEADING,
  PLANNING_REVIEWS_PLANNING_LINK,
  PLANNING_REVIEWS_REVIEWS_LINK,
  PLANNING_REVIEWS_WHY_TWO,
} from "@/lib/vocabulary/planning-reviews-vocabulary";

describe("PlanningReviewsVocabularyRail (TB-2238)", () => {
  it("renders compact strip on planning with peer link to reviews", () => {
    render(
      <PlanningReviewsVocabularyRail currentSurfaceId="improvement-planning" />,
    );

    const strip = screen.getByTestId("planning-reviews-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "improvement-planning");
    expect(strip.textContent ?? "").toContain(PLANNING_REVIEWS_COMPACT_LINE);

    const peer = screen.getByTestId("planning-reviews-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PLANNING_REVIEWS_REVIEWS_LINK.label);
    expect(peer).toHaveAttribute("href", PLANNING_REVIEWS_REVIEWS_LINK.href);
  });

  it("renders compact strip on reviews with peer link to planning", () => {
    render(
      <PlanningReviewsVocabularyRail currentSurfaceId="architecture-reviews" />,
    );

    expect(screen.getByTestId("planning-reviews-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "architecture-reviews",
    );

    const peer = screen.getByTestId("planning-reviews-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PLANNING_REVIEWS_PLANNING_LINK.label);
    expect(peer).toHaveAttribute("href", PLANNING_REVIEWS_PLANNING_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PlanningReviewsVocabularyRail
        currentSurfaceId="improvement-planning"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("planning-reviews-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(PLANNING_REVIEWS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PLANNING_REVIEWS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("planning-reviews-vocabulary-current")).toHaveTextContent(
      PLANNING_REVIEWS_PLANNING_LINK.label,
    );
  });
});
