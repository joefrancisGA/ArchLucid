import { describe, expect, it } from "vitest";

import {
  formatSessionExpiredReturnHint,
  resolveReturnDestinationLabel,
  signInHasReturnDestination,
} from "@/lib/auth/sign-in-return-destination";

describe("sign-in-return-destination", () => {
  it("detects a safe non-root return destination", () => {
    expect(signInHasReturnDestination("/architecture/reviews/run-1")).toBe(true);
    expect(signInHasReturnDestination("/")).toBe(false);
    expect(signInHasReturnDestination("//evil.example")).toBe(false);
    expect(signInHasReturnDestination("/x%2F%2Fevil.example")).toBe(false);
    expect(signInHasReturnDestination("/welcome\\..\\..\\operator")).toBe(false);
    expect(signInHasReturnDestination("/signin/../../administration")).toBe(false);
  });

  it("resolves a human label for a safe return path", () => {
    expect(resolveReturnDestinationLabel("/architecture/reviews/run-1")).toBe("Review detail");
    expect(resolveReturnDestinationLabel("/")).toBeNull();
  });

  it("formats the session-expired return hint", () => {
    expect(formatSessionExpiredReturnHint("Review detail")).toBe(
      "Continue where you left off — sign in to return to Review detail.",
    );
  });
});
