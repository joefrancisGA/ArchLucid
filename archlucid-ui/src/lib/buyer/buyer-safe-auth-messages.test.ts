import { describe, expect, it } from "vitest";

import {
  BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE,
  containsBuyerUnsafeAuthLeak,
  toBuyerSafeAuthFailureMessage,
} from "@/lib/buyer/buyer-safe-auth-messages";

describe("buyer-safe-auth-messages", () => {
  it("keeps the not-configured message free of internals", () => {
    expect(containsBuyerUnsafeAuthLeak(BUYER_SAFE_AUTH_NOT_CONFIGURED_MESSAGE)).toBe(false);
  });

  it("detects common auth leak snippets", () => {
    expect(containsBuyerUnsafeAuthLeak("System.Exception: boom")).toBe(true);
    expect(containsBuyerUnsafeAuthLeak("DevelopmentBypass enabled")).toBe(true);
    expect(containsBuyerUnsafeAuthLeak("Please try again shortly.")).toBe(false);
  });

  it("rewrites unsafe failures to a generic recovery message", () => {
    const safe = toBuyerSafeAuthFailureMessage("SqlException: login failed");

    expect(safe).not.toMatch(/SqlException/i);
    expect(safe.toLowerCase()).toContain("sign-in could not be completed");
  });

  it("preserves already-safe customer messages", () => {
    expect(toBuyerSafeAuthFailureMessage("Your organization requires SSO.")).toBe(
      "Your organization requires SSO.",
    );
  });
});
