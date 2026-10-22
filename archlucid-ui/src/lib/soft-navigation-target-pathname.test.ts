import { describe, expect, it } from "vitest";

import { softNavigationTargetPathname } from "@/lib/soft-navigation-target-pathname";

describe("softNavigationTargetPathname", () => {
  it("returns pathname for absolute-path hrefs", () => {
    expect(softNavigationTargetPathname("/architecture/reviews/customer-intake-modernization")).toBe(
      "/architecture/reviews/customer-intake-modernization",
    );
  });

  it("strips query and hash", () => {
    expect(softNavigationTargetPathname("/architecture/reviews/new?from=home#top")).toBe("/architecture/reviews/new");
  });
});
