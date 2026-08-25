import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryDetailNextPatternFooter } from "./PatternLibraryDetailNextPatternFooter";

describe("PatternLibraryDetailNextPatternFooter", () => {
  it("renders next pattern link", () => {
    render(
      <PatternLibraryDetailNextPatternFooter
        target={{
          patternKey: "pattern-b",
          name: "Pattern B",
          href: "/insights/patterns/pattern-b",
        }}
      />,
    );

    expect(screen.getByTestId("pattern-library-detail-next-pattern-footer")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-next-pattern-action")).toHaveAttribute(
      "href",
      "/insights/patterns/pattern-b",
    );
  });
});
