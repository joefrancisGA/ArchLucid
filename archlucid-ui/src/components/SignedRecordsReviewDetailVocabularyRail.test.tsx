import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignedRecordsReviewDetailVocabularyRail } from "@/components/SignedRecordsReviewDetailVocabularyRail";
import {
  SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE,
  SIGNED_RECORDS_REVIEW_DETAIL_HEADING,
  SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK,
  SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK,
  SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO,
} from "@/lib/vocabulary/signed-records-review-detail-vocabulary";

describe("SignedRecordsReviewDetailVocabularyRail (TB-2272)", () => {
  it("renders signed-records strip with peer link to review detail", () => {
    render(<SignedRecordsReviewDetailVocabularyRail currentSurfaceId="signed-records" />);

    const strip = screen.getByTestId("signed-records-review-detail-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "signed-records");
    expect(strip.textContent ?? "").toContain(SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE);

    const peer = screen.getByTestId("signed-records-review-detail-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK.label);
    expect(peer).toHaveAttribute("href", SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK.href);
  });

  it("renders review-detail strip with peer link to sealed records", () => {
    render(<SignedRecordsReviewDetailVocabularyRail currentSurfaceId="review-detail" />);

    expect(screen.getByTestId("signed-records-review-detail-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "review-detail",
    );

    const peer = screen.getByTestId("signed-records-review-detail-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK.label);
    expect(peer).toHaveAttribute("href", SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <SignedRecordsReviewDetailVocabularyRail currentSurfaceId="signed-records" variant="full" />,
    );

    const strip = screen.getByTestId("signed-records-review-detail-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(SIGNED_RECORDS_REVIEW_DETAIL_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("signed-records-review-detail-vocabulary-current")).toHaveTextContent(
      SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK.label,
    );
  });
});
