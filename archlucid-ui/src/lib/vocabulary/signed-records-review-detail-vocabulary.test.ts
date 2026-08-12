import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE,
  SIGNED_RECORDS_REVIEW_DETAIL_HEADING,
  SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK,
  SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK,
  SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO,
  buildSignedRecordsReviewDetailVocabulary,
  resolveSignedRecordsReviewDetailPeerLink,
} from "@/lib/vocabulary/signed-records-review-detail-vocabulary";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

describe("signed-records-review-detail-vocabulary (TB-2272)", () => {
  it("explains signed review records inventory vs review detail package workspace", () => {
    const model = buildSignedRecordsReviewDetailVocabulary();

    expect(model.heading).toBe(SIGNED_RECORDS_REVIEW_DETAIL_HEADING);
    expect(model.heading.toLowerCase()).toContain("signed");
    expect(model.heading.toLowerCase()).toContain("review detail");
    expect(model.whyTwo).toBe(SIGNED_RECORDS_REVIEW_DETAIL_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("signed review record");
    expect(model.whyTwo.toLowerCase()).toContain("architecture package");
    expect(model.compactLine).toBe(SIGNED_RECORDS_REVIEW_DETAIL_COMPACT_LINE);

    expect(model.signedRecordsLink).toEqual(SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK);
    expect(model.signedRecordsLink.href).toBe(SIGNED_RECORDS_LIST_PATH);
    expect(model.signedRecordsLink.href).toBe("/governance/signed-records");

    expect(model.reviewDetailLink).toEqual(SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK);
    expect(model.reviewDetailLink.href).toBe(REVIEWS_LIST_PATH);
    expect(model.reviewDetailLink.href).toBe("/architecture/reviews");
  });

  it("resolves the peer surface from signed records and review detail", () => {
    expect(resolveSignedRecordsReviewDetailPeerLink("signed-records")).toEqual(
      SIGNED_RECORDS_REVIEW_DETAIL_REVIEW_DETAIL_LINK,
    );

    expect(resolveSignedRecordsReviewDetailPeerLink("review-detail")).toEqual(
      SIGNED_RECORDS_REVIEW_DETAIL_SIGNED_RECORDS_LINK,
    );
  });
});
