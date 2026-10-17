import { describe, expect, it } from "vitest";

import { isSecureNowFindingsDeskRoutePath } from "@/lib/governance/is-securenow-findings-desk-route-path";

describe("isSecureNowFindingsDeskRoutePath", () => {
  it("matches SecureNow compliance findings and assigned-to-me routes", () => {
    expect(isSecureNowFindingsDeskRoutePath("/compliance/findings")).toBe(true);
    expect(isSecureNowFindingsDeskRoutePath("/security/assigned-to-me")).toBe(true);
  });

  it("does not match architecture findings desks", () => {
    expect(isSecureNowFindingsDeskRoutePath("/governance/findings")).toBe(false);
    expect(isSecureNowFindingsDeskRoutePath("/governance/findings/assigned-to-me")).toBe(false);
  });
});
