import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareComparisonDimensionsPreview } from "./CompareComparisonDimensionsPreview";
import { CompareRelatedReviewLinks } from "./CompareRelatedReviewLinks";

describe("Compare workspace orientation", () => {
  it("renders comparison dimension preview for buyers", () => {
    render(<CompareComparisonDimensionsPreview />);

    expect(screen.getByTestId("compare-dimensions-preview")).toBeInTheDocument();
    expect(screen.getByText("Scope changes")).toBeInTheDocument();
    expect(screen.getByText("Governance status changes")).toBeInTheDocument();
  });

  it("renders related review links without journey arrows", () => {
    render(<CompareRelatedReviewLinks />);

    expect(screen.getByTestId("compare-related-review-links")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open signed review record" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization/signed-record",
    );
    expect(screen.getByRole("link", { name: "Open evidence trail" })).toHaveAttribute("href", expect.stringContaining("/graph?"));
  });
});
