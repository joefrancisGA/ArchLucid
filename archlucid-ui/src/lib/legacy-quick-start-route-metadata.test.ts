import { describe, expect, it } from "vitest";

import { LEGACY_QUICK_START_ROUTE_METADATA } from "@/lib/legacy-quick-start-route-metadata";

describe("LEGACY_QUICK_START_ROUTE_METADATA (TB-1818)", () => {
  it("marks the legacy quick-start shim as non-indexable redirect-only metadata", () => {
    expect(LEGACY_QUICK_START_ROUTE_METADATA.title).toBe("Redirecting to get started");
    expect(LEGACY_QUICK_START_ROUTE_METADATA.title?.toLowerCase()).not.toBe("quick start");
    expect(LEGACY_QUICK_START_ROUTE_METADATA.description?.toLowerCase()).toContain("redirect");
    expect(LEGACY_QUICK_START_ROUTE_METADATA.description?.toLowerCase()).toContain("get-started");
    expect(LEGACY_QUICK_START_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
