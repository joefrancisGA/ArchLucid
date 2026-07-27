import { describe, expect, it } from "vitest";

import { softNavigationTargetPathname } from "@/lib/soft-navigation-target-pathname";

describe("softNavigationTargetPathname", () => {
  it("returns pathname for absolute-path hrefs", () => {
    expect(softNavigationTargetPathname("/reviews/claims-intake-modernization")).toBe(
      "/reviews/claims-intake-modernization",
    );
  });

  it("strips query and hash", () => {
    expect(softNavigationTargetPathname("/reviews/new?from=home#top")).toBe("/reviews/new");
  });
});
