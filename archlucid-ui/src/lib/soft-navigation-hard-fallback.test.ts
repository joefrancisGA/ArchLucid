import { describe, expect, it } from "vitest";

import { resolveSoftNavigationHardFallbackAssignUrl } from "@/lib/soft-navigation-hard-fallback";

describe("resolveSoftNavigationHardFallbackAssignUrl", () => {
  it("returns a same-origin assign URL when soft-nav never left home", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "/reviews/claims-intake-modernization",
        "/",
        "",
        "https://www.archlucid.net",
      ),
    ).toBe("/reviews/claims-intake-modernization");
  });

  it("includes query when navigating from home to reviews list", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "/reviews?projectId=default",
        "/",
        "",
        "https://www.archlucid.net",
      ),
    ).toBe("/reviews?projectId=default");
  });

  it("returns null when already on the target path and query", () => {
    expect(
      resolveSoftNavigationHardFallbackAssignUrl(
        "/reviews?projectId=default",
        "/reviews",
        "?projectId=default",
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
