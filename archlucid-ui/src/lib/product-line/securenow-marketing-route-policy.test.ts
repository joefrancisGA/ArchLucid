import { describe, expect, it } from "vitest";

import {
  isMarketingRouteBlockedForProductLine,
  isMarketingRoutePath,
  isSecureNowDraftMarketingPath,
  isSecureNowSampleMarketingPath,
  normalizeMarketingRoutePath,
  shouldRedirectMarketingLayout,
} from "@/lib/product-line/securenow-marketing-route-policy";

describe("securenow-marketing-route-policy", () => {
  it("detects marketing paths with or without trailing slash", () => {
    expect(isMarketingRoutePath("/trust")).toBe(true);
    expect(isMarketingRoutePath("/trust/")).toBe(true);
    expect(isMarketingRoutePath("/showcase/demo-run")).toBe(true);
    expect(isMarketingRoutePath("/")).toBe(false);
    expect(isMarketingRoutePath("/governance/findings")).toBe(false);
  });

  it("normalizes trailing slashes", () => {
    expect(normalizeMarketingRoutePath("/pricing/")).toBe("/pricing");
  });

  it("blocks marketing only for the security product line", () => {
    expect(isMarketingRouteBlockedForProductLine("security")).toBe(true);
    expect(isMarketingRouteBlockedForProductLine("architecture")).toBe(false);
  });

  it("recognizes the SecureNow draft path only", () => {
    expect(isSecureNowDraftMarketingPath("/why-securenow")).toBe(true);
    expect(isSecureNowDraftMarketingPath("/why-securenow/")).toBe(true);
    expect(isSecureNowDraftMarketingPath("/why")).toBe(false);
    expect(isSecureNowDraftMarketingPath("/pricing")).toBe(false);
    expect(isSecureNowDraftMarketingPath("/why-securenow/extra")).toBe(false);
  });

  it("does not treat /why-securenow as a blocked marketing prefix", () => {
    expect(isMarketingRoutePath("/why-securenow")).toBe(false);
    expect(isMarketingRoutePath("/why")).toBe(true);
  });

  it("recognizes the SecureNow sample path only", () => {
    expect(isSecureNowSampleMarketingPath("/securenow-sample")).toBe(true);
    expect(isSecureNowSampleMarketingPath("/securenow-sample/")).toBe(true);
    expect(isSecureNowSampleMarketingPath("/securenow-sample/extra")).toBe(false);
    expect(isMarketingRoutePath("/securenow-sample")).toBe(false);
  });

  it("redirects marketing layout for security except Why and sample paths", () => {
    expect(
      shouldRedirectMarketingLayout({ productLineId: "security", pathname: "/pricing" }),
    ).toBe(true);
    expect(
      shouldRedirectMarketingLayout({ productLineId: "security", pathname: "/see-it" }),
    ).toBe(true);
    expect(
      shouldRedirectMarketingLayout({ productLineId: "security", pathname: "/why-securenow" }),
    ).toBe(false);
    expect(
      shouldRedirectMarketingLayout({ productLineId: "security", pathname: "/securenow-sample" }),
    ).toBe(false);
    expect(
      shouldRedirectMarketingLayout({ productLineId: "architecture", pathname: "/pricing" }),
    ).toBe(false);
    expect(
      shouldRedirectMarketingLayout({ productLineId: "architecture", pathname: "/why-securenow" }),
    ).toBe(false);
  });
});
