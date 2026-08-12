import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecimenDeliverablePreviewCallout } from "@/components/usability/SpecimenDeliverablePreviewCallout";
import {
  REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK,
  REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA,
  REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  showcaseSpecimenFindingsHref,
  showcaseSpecimenSignedReviewRecordHref,
} from "@/lib/showcase-sample-review-registry";

describe("SpecimenDeliverablePreviewCallout", () => {
  it("renders the prominent specimen preview with loadable showcase links", () => {
    render(<SpecimenDeliverablePreviewCallout />);

    expect(screen.getByTestId("reviews-new-specimen-preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("reviews-new-specimen-preview-primary-cta")).toHaveAttribute(
      "href",
      showcaseSpecimenSignedReviewRecordHref(),
    );
    expect(screen.getByRole("link", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK })).toHaveAttribute(
      "href",
      showcaseSpecimenFindingsHref(),
    );
  });

  it("renders a compact variant for home start-review cards", () => {
    render(<SpecimenDeliverablePreviewCallout variant="compact" sectionTestId="home-specimen-preview" />);

    expect(screen.getByTestId("home-specimen-preview-primary-cta")).toHaveAttribute(
      "href",
      showcaseSpecimenSignedReviewRecordHref(),
    );
    expect(screen.getByTestId("home-specimen-preview-findings-link")).toHaveAttribute(
      "href",
      showcaseSpecimenFindingsHref(),
    );
  });
});
