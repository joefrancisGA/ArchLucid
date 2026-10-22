import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PatternLibraryNextReviewFooter,
  patternLibraryNextReviewHref,
} from "./PatternLibraryNextReviewFooter";

describe("PatternLibraryNextReviewFooter", () => {
  it("builds the next review pattern library href from run id", () => {
    expect(patternLibraryNextReviewHref("run-2")).toBe("/insights/patterns?runId=run-2");
  });

  it("renders next review pattern library link", () => {
    render(
      <PatternLibraryNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/patterns?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("pattern-library-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-next-review-action")).toHaveAttribute(
      "href",
      "/insights/patterns?runId=run-2",
    );
  });
});
