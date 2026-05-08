import { describe, expect, it } from "vitest";

import { isOperatorNavLinkAdvancedInDemo, shouldHideOperatorNavLinkInDemo } from "./route-readiness";

describe("shouldHideOperatorNavLinkInDemo", () => {
  it("hides non-allowlisted advanced routes in demo mode", () => {
    expect(shouldHideOperatorNavLinkInDemo("/replay", true)).toBe(true);
    expect(shouldHideOperatorNavLinkInDemo("/compare", true)).toBe(true);
  });

  it("keeps governance, graph, ask, audit, policy packs, and alerts on the demo allowlist", () => {
    for (const href of ["/graph", "/ask", "/governance", "/audit", "/policy-packs", "/alerts"]) {
      expect(shouldHideOperatorNavLinkInDemo(href, true)).toBe(false);
    }
  });

  it("does not hide when demo mode is off", () => {
    expect(shouldHideOperatorNavLinkInDemo("/replay", false)).toBe(false);
  });
});

describe("isOperatorNavLinkAdvancedInDemo", () => {
  it("treats allowlisted advanced routes as not de-emphasized in demo", () => {
    expect(isOperatorNavLinkAdvancedInDemo("/policy-packs", true)).toBe(false);
    expect(isOperatorNavLinkAdvancedInDemo("/alerts", true)).toBe(false);
  });

  it("still marks non-allowlisted advanced routes as advanced in demo", () => {
    expect(isOperatorNavLinkAdvancedInDemo("/replay", true)).toBe(true);
  });
});
