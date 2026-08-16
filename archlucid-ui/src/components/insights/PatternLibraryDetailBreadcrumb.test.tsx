import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PATTERN_LIBRARY_DETAIL_PAGE_TITLE, PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";

import { PatternLibraryDetailBreadcrumb } from "./PatternLibraryDetailBreadcrumb";

describe("PatternLibraryDetailBreadcrumb", () => {
  it("renders insights trail ending on the pattern name when provided", () => {
    render(<PatternLibraryDetailBreadcrumb patternLabel="Private endpoints for PaaS" />);

    expect(screen.getByTestId("pattern-library-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByRole("link", { name: PATTERN_LIBRARY_PAGE_TITLE })).toHaveAttribute(
      "href",
      "/insights/patterns",
    );
    expect(screen.getByText("Private endpoints for PaaS")).toBeInTheDocument();
  });

  it("falls back to Pattern detail when no pattern label is available", () => {
    render(<PatternLibraryDetailBreadcrumb />);

    expect(screen.getByText(PATTERN_LIBRARY_DETAIL_PAGE_TITLE)).toBeInTheDocument();
  });
});
