import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REVIEW_DETAIL_DEFAULT_TAB,
  buildReviewDetailTabHref,
  readReviewDetailTabFromHref,
  readReviewDetailTabFromWindowLocation,
  resolveReviewDetailTab,
  resolveReviewDetailTabFromHash,
  writeReviewDetailTabToUrl,
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
    expect(resolveReviewDetailTabFromHash("sponsor-handoff")).toBe("review-package");
    expect(resolveReviewDetailTabFromHash("artifacts-exports")).toBe("evidence");
    expect(resolveReviewDetailTabFromHash("unknown-anchor")).toBeNull();
  });

  it("builds shareable tab hrefs with reviewTab query param", () => {
    const href = buildReviewDetailTabHref("run-abc", "evidence");

    expect(href).toBe("/architecture/reviews/run-abc?reviewTab=evidence");
    expect(buildReviewDetailTabHref("run-abc", "findings", { hash: "run-explanation" })).toBe(
      "/architecture/reviews/run-abc?reviewTab=findings#run-explanation",
    );
  });

  it("AO-33: keeps nested review paths for tab hrefs when architecture id is known", () => {
    expect(
      buildReviewDetailTabHref("run-abc", "findings", { architectureId: "architecture-identity-001" }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-abc?reviewTab=findings");
  });

  it("reads tab ids from href hash or search param", () => {
    expect(readReviewDetailTabFromHref("#run-explanation")).toBe("findings");
    expect(readReviewDetailTabFromHref("/architecture/reviews/run-1?reviewTab=policies")).toBe("policies");
    expect(readReviewDetailTabFromHref("/architecture/reviews/new")).toBeNull();
  });

  it("writes and reads reviewTab from the browser location without navigation", () => {
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=overview");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    writeReviewDetailTabToUrl("findings");

    expect(replaceStateSpy).toHaveBeenCalled();
    expect(readReviewDetailTabFromWindowLocation()).toBe("findings");
    expect(window.location.search).toContain("reviewTab=findings");
  });

  it("prefers hash-mapped tabs when reading from window location", () => {
    window.history.replaceState({}, "", "/architecture/reviews/run-1?reviewTab=overview#run-explanation");

    expect(readReviewDetailTabFromWindowLocation()).toBe("findings");
  });
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});
