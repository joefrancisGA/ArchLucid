import { describe, expect, it } from "vitest";

import {
  reviewPackageSearchAriaLabel,
  reviewPackageSearchPlaceholder,
} from "@/lib/review-detail-package-search-scope";

describe("review-detail-package-search-scope (WA-19)", () => {
  it("uses package-first copy for this review scope", () => {
    expect(reviewPackageSearchPlaceholder("package")).toBe("Search this review…");
    expect(reviewPackageSearchAriaLabel("package")).toBe("Search this review");
  });

  it("uses workspace copy when expanded", () => {
    expect(reviewPackageSearchPlaceholder("workspace")).toBe("Search workspace…");
    expect(reviewPackageSearchAriaLabel("workspace")).toBe("Search workspace");
  });
});
