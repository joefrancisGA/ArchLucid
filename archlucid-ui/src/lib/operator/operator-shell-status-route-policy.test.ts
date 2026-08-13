import { describe, expect, it } from "vitest";

import { shouldFetchOperatorShellStatusOnRoute } from "@/lib/operator/operator-shell-status-route-policy";

describe("shouldFetchOperatorShellStatusOnRoute", () => {
  it("allows shell status on primary operator work routes", () => {
    expect(shouldFetchOperatorShellStatusOnRoute("/")).toBe(true);
    expect(shouldFetchOperatorShellStatusOnRoute("/governance/alerts")).toBe(true);
    expect(shouldFetchOperatorShellStatusOnRoute("/architecture/reviews")).toBe(true);
  });

  it("skips shell status on help, auth, and access-denied routes", () => {
    expect(shouldFetchOperatorShellStatusOnRoute("/help")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/help/billing-and-plans")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/auth/signin")).toBe(false);
    expect(shouldFetchOperatorShellStatusOnRoute("/403")).toBe(false);
  });
});
