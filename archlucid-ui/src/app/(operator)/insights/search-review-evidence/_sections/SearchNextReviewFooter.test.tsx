import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchNextReviewFooter } from "./SearchNextReviewFooter";

describe("SearchNextReviewFooter", () => {
  it("renders next review search link", () => {
    render(
      <SearchNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/search-review-evidence?runId=run-2&q=phi",
        }}
      />,
    );

    expect(screen.getByTestId("search-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review search")).toBeInTheDocument();
    expect(screen.getByTestId("search-next-review-action")).toHaveAttribute(
      "href",
      "/insights/search-review-evidence?runId=run-2&q=phi",
    );
  });
});
