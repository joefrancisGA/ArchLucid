import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import {
  isSponsorOnlyPrincipal,
  resolveSponsorExecutiveRedirectTarget,
} from "@/lib/sponsor-executive-shell-redirect";

describe("isSponsorOnlyPrincipal", () => {
  it("returns true for Sponsor without Execute-class roles", () => {
    expect(isSponsorOnlyPrincipal(["Sponsor"])).toBe(true);
  });

  it("returns false when Operator is also present", () => {
    expect(isSponsorOnlyPrincipal(["Sponsor", "Operator"])).toBe(false);
  });

  it("returns false without Sponsor", () => {
    expect(isSponsorOnlyPrincipal(["Reader"])).toBe(false);
  });
});

describe("resolveSponsorExecutiveRedirectTarget", () => {
  it("returns null for operator review routes", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/architecture/reviews/run-1",
      }),
    ).toBeNull();
  });

  it("preserves query strings on review list routes", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/architecture/reviews",
        search: "?projectId=default",
      }),
    ).toBeNull();
  });

  it("returns null for the consolidated dashboard route", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: EXECUTIVE_DASHBOARD_HREF,
      }),
    ).toBeNull();
  });

  it("returns null for the operator home route", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/",
      }),
    ).toBeNull();
  });

  it("redirects other operator paths to the dashboard", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/policy-packs",
      }),
    ).toBe(EXECUTIVE_DASHBOARD_HREF);
  });
});
