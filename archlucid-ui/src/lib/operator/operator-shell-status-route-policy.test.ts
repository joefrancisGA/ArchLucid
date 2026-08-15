import { describe, expect, it } from "vitest";

import { shouldFetchOperatorShellStatusOnRoute } from "@/lib/operator/operator-shell-status-route-policy";

describe("shouldFetchOperatorShellStatusOnRoute", () => {
  it("allows shell status on primary operator work routes", () => {
    expect(shouldFetchOperatorShellStatusOnRoute("/")).toBe(true);
    expect(shouldFetchOperatorShellStatusOnRoute("/governance/alerts")).toBe(true);
    expect(shouldFetchOperatorShellStatusOnRoute("/architecture/reviews")).toBe(true);
    expect(shouldFetchOperatorShellStatusOnRoute("/architecture/reviews/run-123")).toBe(true);
  });

  it("skips shell status on help, auth, access-denied, and oauth callback routes", () => {
    expect(shouldFetchOperatorShellStatusOnRoute("/help")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/help/billing-and-plans")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/auth/signin")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/auth/session-expired")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/403")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/integrations/itsm/oauth/callback")).toBe(false);
  });

  it("skips shell status on cold shared and read-only review workspace links", () => {
    const reviewPath = "/architecture/reviews/claims-intake-modernization-run";

    expect(shouldFetchOperatorShellStatusOnRoute(reviewPath, "readOnly=1")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute(reviewPath, "?shared=1")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute(reviewPath, "fromShare=1")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute(reviewPath)).toBe(true);
  });
});
