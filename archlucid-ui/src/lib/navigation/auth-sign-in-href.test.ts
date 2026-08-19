import { describe, expect, it } from "vitest";

import { buildAuthSignInHref, buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";

describe("buildAuthSignInHref", () => {
  it("returns bare sign-in path when no options are provided", () => {
    expect(buildAuthSignInHref()).toBe("/auth/signin");
  });

  it("adds reason and a safe return path for protected-route recovery", () => {
    expect(
      buildAuthSignInHref({
        reason: "unauthorized",
        returnPath: "/sponsor/reviews",
      }),
    ).toBe("/auth/signin?reason=unauthorized&returnUrl=%2Fexecutive%2Freviews");
  });

  it("drops unsafe return paths", () => {
    expect(
      buildAuthSignInHref({
        reason: "unauthorized",
        returnPath: "https://evil.example",
      }),
    ).toBe("/auth/signin?reason=unauthorized");
  });
});

describe("buildSessionExpiredHref", () => {
  it("defaults to idle-timeout on the session-expired route", () => {
    expect(buildSessionExpiredHref("/architecture/reviews/run-1")).toBe(
      "/auth/session-expired?reason=idle-timeout&returnUrl=%2Farchitecture%2Freviews%2Frun-1",
    );
  });
});
