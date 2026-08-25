import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AskNextReviewFooter, askNextReviewHref } from "./AskNextReviewFooter";

describe("AskNextReviewFooter", () => {
  it("builds the next review ask href from run id", () => {
    expect(askNextReviewHref("run-2")).toBe("/insights/ask-review-questions?runId=run-2");
    expect(askNextReviewHref("run 2")).toBe("/insights/ask-review-questions?runId=run+2");
  });

  it("renders next review ask link", () => {
    render(
      <AskNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/ask-review-questions?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("ask-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review to ask about")).toBeInTheDocument();
    expect(screen.getByTestId("ask-next-review-action")).toHaveAttribute(
      "href",
      "/insights/ask-review-questions?runId=run-2",
    );
  });
});
