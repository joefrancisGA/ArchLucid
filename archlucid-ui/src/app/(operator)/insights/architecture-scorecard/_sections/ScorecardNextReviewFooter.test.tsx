import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScorecardNextReviewFooter } from "./ScorecardNextReviewFooter";

describe("ScorecardNextReviewFooter", () => {
  it("renders next review scorecard link", () => {
    render(
      <ScorecardNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/architecture-scorecard?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("scorecard-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review scorecard")).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-next-review-action")).toHaveAttribute(
      "href",
      "/insights/architecture-scorecard?runId=run-2",
    );
  });
});
