import { describe, expect, it } from "vitest";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  assertReviewPackageShareWhenToShareMatrixComplete,
  buildReviewPackageShareWhenToSharePreview,
  REVIEW_PACKAGE_SHARE_WHEN_TO_SHARE_TITLE,
  reviewPackageShareWhenToShareRowById,
} from "@/lib/review-package-share-when-to-share";

describe("review-package-share-when-to-share (TB-2243)", () => {
  it("covers share link, print, and export occasions with signed-record nouns", () => {
    assertReviewPackageShareWhenToShareMatrixComplete();

    const preview = buildReviewPackageShareWhenToSharePreview();

    expect(preview.title).toBe(REVIEW_PACKAGE_SHARE_WHEN_TO_SHARE_TITLE);
    expect(preview.summary.toLowerCase()).toContain(
      BUYER_SURFACE_VOCABULARY.sealedReviewRecord.toLowerCase(),
    );

    const shareLink = reviewPackageShareWhenToShareRowById("shareLink");
    const print = reviewPackageShareWhenToShareRowById("print");
    const exportRow = reviewPackageShareWhenToShareRowById("export");

    expect(shareLink.label).toBe("Share link");
    expect(shareLink.occasion.toLowerCase()).toMatch(/url|link|showcase/);
    expect(print.label).toBe("Print / Save as PDF");
    expect(print.occasion.toLowerCase()).toMatch(/print|summary/);
    expect(exportRow.label).toBe("Export deliverable");
    expect(exportRow.occasion.toLowerCase()).toMatch(/export|deliverable|signed/);
  });

  it("stays distinct from share-link permission clarity wording", () => {
    const preview = buildReviewPackageShareWhenToSharePreview();
    const blob = `${preview.title} ${preview.summary} ${preview.rows.map((row) => row.occasion).join(" ")}`.toLowerCase();

    expect(blob).not.toContain("what this link allows");
    expect(blob).not.toContain("vs invite");
    expect(blob).toContain("when");
  });
});
