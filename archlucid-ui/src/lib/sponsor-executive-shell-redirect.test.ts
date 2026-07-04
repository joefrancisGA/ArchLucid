import { describe, expect, it } from "vitest";

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
  it("maps operator review routes to executive equivalents", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/reviews/run-1",
      }),
    ).toBe("/executive/reviews/run-1");
  });

  it("preserves query strings on review list routes", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/reviews",
        search: "?projectId=default",
      }),
    ).toBe("/executive/reviews?projectId=default");
  });

  it("returns null for executive routes", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/executive/reviews",
      }),
    ).toBeNull();
  });

  it("returns null for the consolidated dashboard route", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/dashboard",
      }),
    ).toBeNull();
  });

  it("returns null for the operator home route (executive shell's architect-workspace handoff link)", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/",
      }),
    ).toBeNull();
  });

  it("redirects other operator paths to executive reviews index", () => {
    expect(
      resolveSponsorExecutiveRedirectTarget({
        pathname: "/policy-packs",
      }),
    ).toBe("/executive/reviews");
  });
});
