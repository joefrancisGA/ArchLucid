import { describe, expect, it } from "vitest";

import { isOperatorOidcKeepaliveRoute } from "@/lib/auth/operator-oidc-keepalive-route";

describe("isOperatorOidcKeepaliveRoute (LP-12)", () => {
  it("enables keepalive on livelihood editor operator routes", () => {
    expect(isOperatorOidcKeepaliveRoute("/architecture/reviews/run-001/findings/finding-001")).toBe(true);
    expect(isOperatorOidcKeepaliveRoute("/governance/policy-packs")).toBe(true);
    expect(isOperatorOidcKeepaliveRoute("/architecture/reviews/run-001")).toBe(true);
  });

  it("disables keepalive on marketing and auth onboarding routes", () => {
    expect(isOperatorOidcKeepaliveRoute("/trust")).toBe(false);
    expect(isOperatorOidcKeepaliveRoute("/pricing")).toBe(false);
    expect(isOperatorOidcKeepaliveRoute("/auth/login")).toBe(false);
  });
});
