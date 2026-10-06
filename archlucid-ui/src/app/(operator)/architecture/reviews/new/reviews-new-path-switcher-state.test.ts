import { describe, expect, it } from "vitest";

import {
  buildReviewsNewPathHref,
  resolveInitialReviewsNewActivePath,
} from "./reviews-new-path-switcher-state";

describe("buildReviewsNewPathHref (TB-1867)", () => {
  it("sets path while preserving unrelated query keys", () => {
    const href = buildReviewsNewPathHref(
      "/architecture/reviews/new",
      "guided-intake",
      new URLSearchParams("intent=create-architecture&path=quick-review"),
    );

    expect(href).toBe("/architecture/reviews/new?intent=create-architecture&path=guided-intake");
  });

  it("rewrites path=detailed for the Templates and imports tab", () => {
    const href = buildReviewsNewPathHref(
      "/architecture/reviews/new",
      "detailed",
      new URLSearchParams("path=quick-review"),
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
