import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";

import { PatternLibraryBreadcrumb } from "./PatternLibraryBreadcrumb";

describe("PatternLibraryBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<PatternLibraryBreadcrumb />);

    expect(screen.queryByTestId("pattern-library-breadcrumb")).not.toBeInTheDocument();
    expect(PATTERN_LIBRARY_PAGE_TITLE.length).toBeGreaterThan(0);
  });
});
