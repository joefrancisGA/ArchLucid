import { describe, expect, it } from "vitest";

import { resolveSoftNavigationHardFallbackAssignUrl } from "@/lib/soft-navigation-hard-fallback";

describe("resolveSoftNavigationHardFallbackAssignUrl", () => {
  it("returns a same-origin assign URL when soft-nav never left home", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "/architecture/reviews/customer-intake-modernization",
        "/",
        "",
        "https://www.archlucid.net",
      ),
    ).toBe("/architecture/reviews/customer-intake-modernization");
  });

  it("includes query when navigating from home to reviews list", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "/architecture/reviews",
        "/",
        "",
        "https://www.archlucid.net",
      ),
    ).toBe("/architecture/reviews");
  });

  it("returns null when already on the target path and query", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "/architecture/reviews",
        "/architecture/reviews",
        "",
        "https://www.archlucid.net",
      ),
    ).toBeNull();
  });

  it("rejects cross-origin hrefs", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "https://evil.example/phish",
        "/",
        "",
        "https://www.archlucid.net",
      ),
    ).toBeNull();
  });
});
