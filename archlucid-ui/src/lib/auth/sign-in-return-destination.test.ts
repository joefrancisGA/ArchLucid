import { describe, expect, it } from "vitest";

import {
  SIGN_IN_RETURN_DESTINATION_HINT,
  signInHasReturnDestination,
} from "@/lib/auth/sign-in-return-destination";

describe("signInHasReturnDestination", () => {
  it("returns true for safe non-root return paths", () => {
    expect(signInHasReturnDestination("/architecture/reviews/run-1")).toBe(true);
  });

  it("returns false for root and unsafe paths", () => {
    expect(signInHasReturnDestination("/")).toBe(false);
    expect(signInHasReturnDestination("https://evil.example")).toBe(false);
    expect(signInHasReturnDestination(undefined)).toBe(false);
  });
});

describe("SIGN_IN_RETURN_DESTINATION_HINT", () => {
  it("is non-empty customer-facing copy", () => {
    expect(SIGN_IN_RETURN_DESTINATION_HINT.length).toBeGreaterThan(20);
  });
});
