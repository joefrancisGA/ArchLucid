import { describe, expect, it } from "vitest";

import { LEGACY_LOGIN_ROUTE_METADATA } from "@/lib/legacy-login-route-metadata";

describe("LEGACY_LOGIN_ROUTE_METADATA (TB-1793)", () => {
  it("marks the legacy login shim as non-indexable redirect-only metadata", () => {
    expect(LEGACY_LOGIN_ROUTE_METADATA.title).toBe("Redirecting to sign in");
    expect(LEGACY_LOGIN_ROUTE_METADATA.title?.toLowerCase()).not.toBe("login");
    expect(LEGACY_LOGIN_ROUTE_METADATA.description?.toLowerCase()).toContain("redirect");
    expect(LEGACY_LOGIN_ROUTE_METADATA.description?.toLowerCase()).toContain("auth/signin");
    expect(LEGACY_LOGIN_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
