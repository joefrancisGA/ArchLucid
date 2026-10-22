import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewsHubContinueReviewStrip } from "./ReviewsHubContinueReviewStrip";

describe("ReviewsHubContinueReviewStrip", () => {
  it("renders human-readable stalled duration copy", () => {
    render(
      <ReviewsHubContinueReviewStrip
        candidate={{
          runId: "run-stalled",
          title: "Claims intake review",
          href: "/architecture/reviews/run-stalled",
          kind: "review-in-progress",
          isStalled: true,
          elapsedMinutes: 2812,
        }}
      />,
    );

    expect(screen.getByText("In progress for 46 hours — pick up where you left off.")).toBeInTheDocument();
  });

  it("renders continue action for an in-flight review", () => {
    render(
      <ReviewsHubContinueReviewStrip
        candidate={{
          runId: "run-a",
          title: "Claims intake review",
          href: "/architecture/reviews/run-a",
          kind: "review-in-progress",
          isStalled: false,
          elapsedMinutes: 0,
        }}
      />,
    );

    expect(screen.getByTestId("reviews-hub-continue-review-strip")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-continue-review-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a",
    );
  });
});
