import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
  WORKING_REVIEWS_HUB_PAGE_TITLE,
} from "./reviews-hub-copy";
import { resolveReviewsHubPageCopy } from "./reviews-hub-page-copy-resolver";

describe("resolveReviewsHubPageCopy (AO-26)", () => {
  it("uses inbox framing in Working mode", () => {
    expect(resolveReviewsHubPageCopy(true)).toEqual({
      title: WORKING_REVIEWS_HUB_PAGE_TITLE,
      subtitle: WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
    });
    expect(WORKING_REVIEWS_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("cross-architecture");
  });

  it("keeps Guided portfolio copy outside Working mode", () => {
    expect(resolveReviewsHubPageCopy(false)).toEqual({
      title: REVIEWS_HUB_PAGE_TITLE,
      subtitle: REVIEWS_HUB_PAGE_SUBTITLE,
    });
  });
});
