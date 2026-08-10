import { describe, expect, it } from "vitest";

import { LEGACY_ONBOARDING_START_ROUTE_METADATA } from "@/lib/legacy-onboarding-start-route-metadata";

describe("LEGACY_ONBOARDING_START_ROUTE_METADATA (TB-1802)", () => {
  it("marks the legacy onboarding-start shim as non-indexable redirect-only metadata", () => {
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.title).toBe("Redirecting to onboarding");
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.title?.toLowerCase()).not.toBe("onboarding start");
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.description?.toLowerCase()).toContain("redirect");
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.description?.toLowerCase()).toContain("first-review-guide");
    expect(LEGACY_ONBOARDING_START_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
