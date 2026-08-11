import { describe, expect, it } from "vitest";

import { buildLoginRedirectPath } from "./legacy-login-redirect";

describe("buildLoginRedirectPath (TB-1791 / TB-1792)", () => {
  it("returns bare /auth/signin when search is empty", () => {
    expect(buildLoginRedirectPath({})).toBe("/auth/signin");
  });

  it("copies scalar query params", () => {
    expect(buildLoginRedirectPath({ returnUrl: "/architecture/reviews" })).toBe(
      "/auth/signin?returnUrl=%2Farchitecture%2Freviews",
    );
  });

  it("appends repeated keys from array values", () => {
    const path = buildLoginRedirectPath({ scope: ["read", "write"] });

    expect(path).toContain("/auth/signin?");
    expect(path).toContain("scope=read");
    expect(path).toContain("scope=write");
  });

  it("routes reason=idle-timeout to /auth/session-expired (TB-1791)", () => {
    expect(buildLoginRedirectPath({ reason: "idle-timeout" })).toBe(
      "/auth/session-expired?reason=idle-timeout",
    );
  });

  it("preserves returnUrl on the idle-timeout → session-expired path", () => {
    expect(
      buildLoginRedirectPath({
        reason: "idle-timeout",
        returnUrl: "/architecture/reviews",
      }),
    ).toBe("/auth/session-expired?reason=idle-timeout&returnUrl=%2Farchitecture%2Freviews");
  });

  it("treats idle-timeout in a repeated reason array as session-expired", () => {
    const path = buildLoginRedirectPath({ reason: ["idle-timeout", "other"] });

    expect(path.startsWith("/auth/session-expired?")).toBe(true);
    expect(path).toContain("reason=idle-timeout");
    expect(path).toContain("reason=other");
  });
});
