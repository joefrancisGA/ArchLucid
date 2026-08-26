import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecimenDeliverablePreviewCallout } from "@/components/usability/SpecimenDeliverablePreviewCallout";
import {
  REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK,
  REVIEWS_NEW_SPECIMEN_PREVIEW_LEAD,
  REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA,
  REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_SHORT_HELPER_MEASURE_CLASS } from "@/lib/design-tokens";
import {
  showcaseSpecimenFindingsHref,
  showcaseSpecimenSignedReviewRecordHref,
} from "@/lib/showcase-sample-review-registry";

describe("SpecimenDeliverablePreviewCallout", () => {
  it("renders the prominent specimen preview with loadable showcase links", () => {
    render(<SpecimenDeliverablePreviewCallout />);

    expect(screen.getByTestId("reviews-new-specimen-preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE })).toBeInTheDocument();
    const lead = screen.getByText(REVIEWS_NEW_SPECIMEN_PREVIEW_LEAD);
    expect(lead.className).toContain(OPERATOR_SHORT_HELPER_MEASURE_CLASS);
    expect(lead.className).not.toContain("max-w-prose");
    const primaryCta = screen.getByTestId("reviews-new-specimen-preview-primary-cta");
    expect(primaryCta).toHaveAttribute("href", showcaseSpecimenSignedReviewRecordHref());
    expect(primaryCta.className).toContain("border-neutral-300");
    expect(primaryCta.className).not.toContain("bg-[var(--al-primary-action-bg)]");
    expect(screen.getByRole("link", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK })).toHaveAttribute(
      "href",
      showcaseSpecimenFindingsHref(),
    );
  });

  it("renders a compact variant for home start-review cards", () => {
    render(<SpecimenDeliverablePreviewCallout variant="compact" sectionTestId="home-specimen-preview" />);

    expect(screen.getByTestId("home-specimen-preview-primary-link")).toHaveAttribute(
      "href",
      showcaseSpecimenSignedReviewRecordHref(),
    );
    expect(screen.getByTestId("home-specimen-preview-findings-link")).toHaveAttribute(
      "href",
      showcaseSpecimenFindingsHref(),
    );
    expect(screen.queryByTestId("home-specimen-preview-primary-cta")).toBeNull();
  });

  it("renders inline header links for returning tenants on reviews/new", () => {
    render(
      <p>
        Optional cloud hint
        <SpecimenDeliverablePreviewCallout variant="header-links" sectionTestId="reviews-new-specimen-preview" />
      </p>,
    );

    expect(screen.getByTestId("reviews-new-specimen-preview-primary-link")).toHaveAttribute(
      "href",
      showcaseSpecimenSignedReviewRecordHref(),
    );
    expect(screen.getByTestId("reviews-new-specimen-preview-findings-link")).toHaveAttribute(
      "href",
      showcaseSpecimenFindingsHref(),
    );
    expect(screen.queryByRole("heading", { name: REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE })).not.toBeInTheDocument();
  });
});
