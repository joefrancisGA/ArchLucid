import { describe, expect, it } from "vitest";

import {
  REVIEWS_LIST_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeReviewsList,
} from "./reviews-list-virtualization";

describe("reviews-list-virtualization", () => {
  it("does not virtualize below the row threshold", () => {
    expect(shouldVirtualizeReviewsList(0)).toBe(false);
    expect(shouldVirtualizeReviewsList(REVIEWS_LIST_VIRTUALIZE_MIN_ROWS - 1)).toBe(false);
  });

  it("virtualizes at and above the row threshold", () => {
    expect(shouldVirtualizeReviewsList(REVIEWS_LIST_VIRTUALIZE_MIN_ROWS)).toBe(true);
  });
});
