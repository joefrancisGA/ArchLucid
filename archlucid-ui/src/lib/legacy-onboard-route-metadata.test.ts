import { describe, expect, it } from "vitest";

import { LEGACY_ONBOARD_ROUTE_METADATA } from "@/lib/legacy-onboard-route-metadata";

describe("LEGACY_ONBOARD_ROUTE_METADATA (TB-1797)", () => {
  it("marks the legacy onboard shim as non-indexable redirect-only metadata", () => {
    expect(LEGACY_ONBOARD_ROUTE_METADATA.title).toBe("Redirecting to onboarding");
    expect(LEGACY_ONBOARD_ROUTE_METADATA.title?.toLowerCase()).not.toBe("onboard");
    expect(LEGACY_ONBOARD_ROUTE_METADATA.description?.toLowerCase()).toContain("redirect");
    expect(LEGACY_ONBOARD_ROUTE_METADATA.description?.toLowerCase()).toContain("first-review-guide");
    expect(LEGACY_ONBOARD_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
