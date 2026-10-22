import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";

import { PatternLibraryBreadcrumb } from "./PatternLibraryBreadcrumb";

describe("PatternLibraryBreadcrumb", () => {
  it("renders insights trail ending on Pattern library", () => {
    render(<PatternLibraryBreadcrumb />);

    expect(screen.getByTestId("pattern-library-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Insights" })).toHaveAttribute("href", "/insights/evidence-graph");
    expect(screen.getByText(PATTERN_LIBRARY_PAGE_TITLE)).toBeInTheDocument();
  });
});
