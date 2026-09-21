import { describe, expect, it } from "vitest";

import {
  isMarketingRouteBlockedForProductLine,
  isMarketingRoutePath,
  normalizeMarketingRoutePath,
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
});
