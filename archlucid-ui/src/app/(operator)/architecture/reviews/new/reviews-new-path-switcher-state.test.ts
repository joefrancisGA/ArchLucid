import { describe, expect, it } from "vitest";

import {
  reviewsNewPathHrefFromSearch,
  resolveInitialReviewsNewActivePath,
} from "./reviews-new-path-switcher-state";

describe("reviewsNewPathHrefFromSearch (TB-1867)", () => {
  it("sets path while preserving unrelated query keys", () => {
    const href = reviewsNewPathHrefFromSearch(
      "intent=create-architecture&path=quick-review",
      "guided-intake",
      "/architecture/reviews/new",
    );

    expect(href).toBe("/architecture/reviews/new?intent=create-architecture&path=guided-intake");
  });

  it("clears orphan intakeStep when switching intake paths", () => {
    const href = reviewsNewPathHrefFromSearch(
      "path=quick-review&intakeStep=2",
      "detailed",
      "/architecture/reviews/new",
    );

    expect(href).toContain("path=detailed");
    expect(href).not.toContain("intakeStep");
  });

  it("rewrites path=detailed for the Templates and imports tab", () => {
    const href = reviewsNewPathHrefFromSearch(
      "path=quick-review",
      "detailed",
      "/architecture/reviews/new",
    );

    expect(href).toBe("/architecture/reviews/new?path=detailed");
  });
});

describe("resolveInitialReviewsNewActivePath", () => {
  it("defaults unrecognized path= values to quick-review when no baseline or preset flags apply", () => {
    const path = resolveInitialReviewsNewActivePath({
      pathQuery: "detailed-review",
      baselineFirst: false,
      presetGreenfield: false,
      activeTour: false,
    });

    expect(path).toBe("quick-review");
  });

  it("opens detailed wizard for baseline=1 even when path= is unrecognized", () => {
    const path = resolveInitialReviewsNewActivePath({
      pathQuery: "detailed-review",
      baselineFirst: true,
      presetGreenfield: false,
      activeTour: false,
    });

    expect(path).toBe("detailed");
  });
});
