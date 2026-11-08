import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryDetailBreadcrumb } from "./PatternLibraryDetailBreadcrumb";

describe("PatternLibraryDetailBreadcrumb", () => {
  it("renders nothing (TB-2090 system-wide breadcrumb removal)", () => {
    const { container } = render(<PatternLibraryDetailBreadcrumb patternLabel="Private endpoints for PaaS" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("still renders nothing without a pattern label", () => {
    const { container } = render(<PatternLibraryDetailBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
