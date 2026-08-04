import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpReviewPackagesGuideView } from "@/app/(operator)/help/_sections/HelpReviewPackagesGuideView";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

const entry: ProductDocumentationEntry = {
  slug: "review-packages",
  title: "Reviews",
  summary: "Browse architecture packages.",
  audience: "operator",
  sourcePaths: ["docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md"],
  contentKind: "product-help",
  pdfStatus: null,
};

describe("HelpReviewPackagesGuideView", () => {
  it("renders specialty root and primary Open reviews CTA", () => {
    render(
      <HelpReviewPackagesGuideView
        entry={entry}
        markdown="# Architecture packages\n\nBrowse packages in Reviews."
      />,
    );

    expect(screen.getByTestId("help-review-packages-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-review-packages-page-title")).toHaveTextContent(
      "Architecture packages",
    );

    const openReviews = screen.getByTestId("help-review-packages-open-reviews");

    expect(openReviews).toHaveAttribute("href", "/architecture/reviews");
    expect(openReviews).toHaveTextContent("Open reviews");
  });
});
