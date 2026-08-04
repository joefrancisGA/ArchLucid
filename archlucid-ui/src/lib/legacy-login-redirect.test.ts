import { describe, expect, it } from "vitest";

import { buildLoginRedirectPath } from "./legacy-login-redirect";

describe("buildLoginRedirectPath (TB-1792)", () => {
  it("returns bare /auth/signin when search is empty", () => {
    expect(buildLoginRedirectPath({})).toBe("/auth/signin");
  });

  it("copies scalar query params", () => {
    expect(buildLoginRedirectPath({ returnUrl: "/architecture/reviews" })).toBe("/auth/signin?returnUrl=%2Farchitecture%2Freviews");
  });

  it("appends repeated keys from array values", () => {
    const path = buildLoginRedirectPath({ scope: ["read", "write"] });

    expect(path).toContain("/auth/signin?");
    expect(path).toContain("scope=read");
    expect(path).toContain("scope=write");
  });
});
