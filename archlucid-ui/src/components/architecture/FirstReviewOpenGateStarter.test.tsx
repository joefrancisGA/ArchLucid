import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_OPEN_GATE_STARTER_HREF } from "@/lib/architecture/first-review-open-gate-starter-copy";

import { FirstReviewOpenGateStarter } from "./FirstReviewOpenGateStarter";

describe("FirstReviewOpenGateStarter", () => {
  it("links the sample review open-gate href", () => {
    render(<FirstReviewOpenGateStarter />);

    expect(screen.getByTestId("first-review-open-gate-starter-link")).toHaveAttribute(
      "href",
      FIRST_REVIEW_OPEN_GATE_STARTER_HREF,
    );
    expect(screen.getByText(/Not a customer result/)).toBeInTheDocument();
    expect(screen.getByText(/Policy-pack assignment is not this review/)).toBeInTheDocument();
    expect(screen.getByTestId("first-review-open-gate-starter-link")).toHaveAttribute(
      "aria-describedby",
      "first-review-open-gate-starter-lead first-review-open-gate-starter-not-this-review",
    );
  });
});
