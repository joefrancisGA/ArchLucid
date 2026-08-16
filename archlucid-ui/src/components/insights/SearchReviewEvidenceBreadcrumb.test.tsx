import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SEARCH_PAGE_TITLE } from "@/app/(operator)/insights/search-review-evidence/_sections/search-page-copy";

import { SearchReviewEvidenceBreadcrumb } from "./SearchReviewEvidenceBreadcrumb";

describe("SearchReviewEvidenceBreadcrumb", () => {
  it("renders insights trail ending on Search review evidence", () => {
    render(<SearchReviewEvidenceBreadcrumb />);

    expect(screen.getByTestId("search-review-evidence-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByText(SEARCH_PAGE_TITLE)).toBeInTheDocument();
  });
});
