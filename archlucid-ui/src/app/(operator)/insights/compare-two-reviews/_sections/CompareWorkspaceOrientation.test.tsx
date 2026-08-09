import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getShowcaseEvidenceTrailHref, getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA, BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA } from "@/lib/buyer-polish-copy";

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
    expect(screen.getByRole("link", { name: BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA })).toHaveAttribute(
      "href",
      getShowcaseManifestHref(),
    );
    expect(screen.getByRole("link", { name: BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA })).toHaveAttribute(
      "href",
      getShowcaseEvidenceTrailHref(),
    );
  });
});
