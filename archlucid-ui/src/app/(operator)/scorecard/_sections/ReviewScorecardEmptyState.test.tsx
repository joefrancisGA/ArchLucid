import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewScorecardEmptyState } from "@/app/(operator)/scorecard/_sections/ReviewScorecardEmptyState";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE,
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_TITLE,
  REVIEW_SCORECARD_OPEN_PACKAGES_ACTION,
  REVIEW_SCORECARD_PREVIEW_METRICS,
  REVIEW_SCORECARD_PREVIEW_SECTION_TITLE,
  REVIEW_SCORECARD_SAMPLE_HREF,
  REVIEW_SCORECARD_VIEW_SAMPLE_ACTION,
} from "@/lib/review-scorecard-empty-state";

describe("ReviewScorecardEmptyState", () => {
  it("renders executive-oriented empty copy, actions, and metric preview placeholders", () => {
    render(<ReviewScorecardEmptyState />);

    expect(screen.getByTestId("review-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_EMPTY_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEW_SCORECARD_PREVIEW_SECTION_TITLE })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toHaveAttribute(
      "href",
      "/reviews/new",
    );
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_OPEN_PACKAGES_ACTION })).toHaveAttribute(
      "href",
      "/reviews",
    );
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_VIEW_SAMPLE_ACTION })).toHaveAttribute(
      "href",
      REVIEW_SCORECARD_SAMPLE_HREF,
    );

    for (const metric of REVIEW_SCORECARD_PREVIEW_METRICS) {
      expect(screen.getByText(metric.label)).toBeInTheDocument();
    }

    expect(screen.getByTestId("review-scorecard-empty-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-summary-row")).not.toBeInTheDocument();
  });
});
