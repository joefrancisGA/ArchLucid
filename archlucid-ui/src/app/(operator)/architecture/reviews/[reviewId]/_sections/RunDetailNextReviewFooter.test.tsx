import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailNextReviewFooter } from "./RunDetailNextReviewFooter";

describe("RunDetailNextReviewFooter", () => {
  it("renders next review link", () => {
    render(
      <RunDetailNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/architecture/reviews/run-2",
        }}
      />,
    );

    expect(screen.getByTestId("run-detail-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-next-review-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-2",
    );
  });
});
