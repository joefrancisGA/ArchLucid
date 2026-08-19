import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import {
  NEW_REVIEW_SAMPLE_ESCAPE_CTA,
  NEW_REVIEW_SAMPLE_ESCAPE_HINT,
} from "@/lib/buyer/buyer-polish-copy";
import { showcaseSpecimenSignedReviewRecordHref } from "@/lib/showcase-sample-review-registry";

describe("NewReviewSampleEscapeLink", () => {
  it("renders the calm, expert-facing guidance copy", () => {
    render(
      <ul>
        <NewReviewSampleEscapeLink />
      </ul>,
    );

    expect(screen.getByTestId("new-review-sample-escape")).toBeInTheDocument();
    expect(screen.getByText(NEW_REVIEW_SAMPLE_ESCAPE_HINT)).toBeInTheDocument();
  });

  it("does not render the retired salesy lead copy", () => {
    render(
      <ul>
        <NewReviewSampleEscapeLink />
      </ul>,
    );

    expect(screen.queryByText(/not ready to configure/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Start with an example/i)).not.toBeInTheDocument();
  });

  it("keeps the completed sample package portion as a clickable link to the sample review", () => {
    render(
      <ul>
        <NewReviewSampleEscapeLink />
      </ul>,
    );

    const link = screen.getByRole("link", { name: NEW_REVIEW_SAMPLE_ESCAPE_CTA });

    expect(link).toHaveAttribute("href", showcaseSpecimenSignedReviewRecordHref());
  });

  it("renders an inline sample escape button for first-pilot intake", () => {
    render(<NewReviewSampleEscapeLink presentation="inline" />);

    expect(screen.getByTestId("new-review-sample-escape-inline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: NEW_REVIEW_SAMPLE_ESCAPE_CTA })).toHaveAttribute(
      "href",
      showcaseSpecimenSignedReviewRecordHref(),
    );
  });
});
