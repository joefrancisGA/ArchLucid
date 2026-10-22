import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  isSponsorOnlyPrincipal,
  resolveSponsorRedirectTarget,
} from "@/lib/sponsor-sponsor-shell-redirect";

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

describe("resolveSponsorRedirectTarget", () => {
  it("returns null for operator review routes", () => {
    expect(
      resolveSponsorRedirectTarget({
        pathname: "/architecture/reviews/run-1",
      }),
    ).toBeNull();
  });

  it("preserves query strings on review list routes", () => {
    expect(
      resolveSponsorRedirectTarget({
        pathname: "/architecture/reviews",
        search: "?projectId=default",
      }),
    ).toBeNull();
  });

  it("returns null for the consolidated dashboard route", () => {
    expect(
      resolveSponsorRedirectTarget({
        pathname: SPONSOR_DASHBOARD_HREF,
      }),
    ).toBeNull();
  });

  it("returns null for the operator home route", () => {
    expect(
      resolveSponsorRedirectTarget({
        pathname: "/",
      }),
    ).toBeNull();
  });

  it("redirects other operator paths to the dashboard", () => {
    expect(
      resolveSponsorRedirectTarget({
        pathname: "/policy-packs",
      }),
    ).toBe(SPONSOR_DASHBOARD_HREF);
  });
});
