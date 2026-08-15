import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewScorecardEmptyState } from "@/app/(operator)/insights/architecture-scorecard/_sections/ReviewScorecardEmptyState";
import {
  REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE,
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS,
  REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE,
  REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  REVIEW_SCORECARD_SAMPLE_HREF,
} from "@/lib/review-scorecard-empty-state";

describe("ReviewScorecardEmptyState", () => {
  it("renders sponsor-oriented empty copy, actions, and metric preview placeholders", () => {
    render(<ReviewScorecardEmptyState />);

    expect(screen.getByTestId("review-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_EMPTY_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_EMPTY_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_PRIMARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_SECONDARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_TERTIARY_CTA })).toHaveAttribute(
      "href",
      REVIEW_SCORECARD_SAMPLE_HREF,
    );

    for (const item of REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(screen.getByTestId("review-scorecard-empty-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-summary-row")).not.toBeInTheDocument();
  });
});
