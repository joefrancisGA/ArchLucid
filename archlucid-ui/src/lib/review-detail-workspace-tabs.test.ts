import { describe, expect, it } from "vitest";

import {
  REVIEW_DETAIL_DEFAULT_TAB,
  buildReviewDetailTabHref,
  readReviewDetailTabFromHref,
  resolveReviewDetailTab,
  resolveReviewDetailTabFromHash,
} from "@/lib/review-detail-workspace-tabs";

describe("review-detail-workspace-tabs", () => {
  it("resolves unknown tab params to overview", () => {
    expect(resolveReviewDetailTab(null)).toBe(REVIEW_DETAIL_DEFAULT_TAB);
    expect(resolveReviewDetailTab("not-a-tab")).toBe(REVIEW_DETAIL_DEFAULT_TAB);
    expect(resolveReviewDetailTab("findings")).toBe("findings");
  });

  it("maps legacy hash anchors to review detail tabs", () => {
    expect(resolveReviewDetailTabFromHash("run-explanation")).toBe("findings");
    expect(resolveReviewDetailTabFromHash("#governance-decision")).toBe("decisions-remediation");
    expect(resolveReviewDetailTabFromHash("submitted-architecture")).toBe("architecture");
    expect(resolveReviewDetailTabFromHash("unknown-anchor")).toBeNull();
  });

  it("builds shareable tab hrefs with reviewTab query param", () => {
    const href = buildReviewDetailTabHref("run-abc", "evidence");

    expect(href).toBe("/reviews/run-abc?reviewTab=evidence");
    expect(buildReviewDetailTabHref("run-abc", "findings", { hash: "run-explanation" })).toBe(
      "/reviews/run-abc?reviewTab=findings#run-explanation",
    );
  });

  it("reads tab ids from href hash or search param", () => {
    expect(readReviewDetailTabFromHref("#run-explanation")).toBe("findings");
    expect(readReviewDetailTabFromHref("/reviews/run-1?reviewTab=policies")).toBe("policies");
    expect(readReviewDetailTabFromHref("/reviews/new")).toBeNull();
  });
});
