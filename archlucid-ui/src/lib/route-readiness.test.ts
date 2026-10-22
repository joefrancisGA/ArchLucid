import { describe, expect, it, vi } from "vitest";

import { isOperatorNavLinkAdvancedInDemo, operatorRouteReadiness, shouldHideOperatorNavLinkInDemo } from "./route-readiness";

describe("shouldHideOperatorNavLinkInDemo", () => {
  it("hides non-allowlisted advanced routes in demo mode", () => {
    expect(shouldHideOperatorNavLinkInDemo("/internal/validate-route", true)).toBe(true);
    expect(shouldHideOperatorNavLinkInDemo("/insights/compare-two-reviews", true)).toBe(true);
  });

  it("keeps governance, graph, ask, audit, policy packs, and alerts on the demo allowlist", () => {
    for (const href of ["/insights/evidence-graph", "/insights/ask-review-questions", "/governance/approval-queue", "/audit", "/policy-packs", "/alerts"]) {
      expect(shouldHideOperatorNavLinkInDemo(href, true)).toBe(false);
    }
  });

  it("does not hide when demo mode is off", () => {
    expect(shouldHideOperatorNavLinkInDemo("/internal/validate-route", false)).toBe(false);
  });
});

describe("operatorRouteReadiness", () => {
  it("treats legacy governance bookmarks as advanced-only via canonicalization", () => {
    for (const href of ["/audit", "/policy-packs", "/alerts", "/alert-rules"]) {
      expect(operatorRouteReadiness(href)).toBe("advanced-only");
    }
  });

  it("treats legacy /digest-subscriptions bookmark as advanced-only Digests hub (TB-1495)", () => {
    expect(operatorRouteReadiness("/digest-subscriptions")).toBe("advanced-only");
    expect(operatorRouteReadiness("/architecture/digests?tab=subscriptions")).toBe("advanced-only");
  });
});

describe("presenter safe mode nav hiding", () => {
  it("hides billing and settings when presenter safe mode is active", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");

    expect(shouldHideOperatorNavLinkInDemo("/administration/billing", true)).toBe(true);
    expect(shouldHideOperatorNavLinkInDemo("/insights/evidence-graph", true)).toBe(false);

    vi.unstubAllEnvs();
  });
});

describe("isOperatorNavLinkAdvancedInDemo", () => {
  it("treats allowlisted advanced routes as not de-emphasized in demo", () => {
    expect(isOperatorNavLinkAdvancedInDemo("/policy-packs", true)).toBe(false);
    expect(isOperatorNavLinkAdvancedInDemo("/alerts", true)).toBe(false);
  });

  it("still marks non-allowlisted advanced routes as advanced in demo", () => {
    expect(isOperatorNavLinkAdvancedInDemo("/internal/validate-route", true)).toBe(true);
  });
});
