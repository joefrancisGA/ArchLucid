import { describe, expect, it } from "vitest";

import { buildReviewsNewPathHref } from "./reviews-new-path-switcher-state";

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
