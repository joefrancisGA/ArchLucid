import { describe, expect, it } from "vitest";

import { isNavLinkActive } from "@/lib/nav-link-active";

describe("isNavLinkActive", () => {
  it("matches home only for exact /", () => {
    expect(isNavLinkActive("/", "/")).toBe(true);
    expect(isNavLinkActive("/reviews", "/")).toBe(false);
  });

  it("matches /reviews list but not /reviews/new or review detail", () => {
    expect(isNavLinkActive("/reviews", "/reviews?projectId=default")).toBe(true);
    expect(isNavLinkActive("/reviews/new", "/reviews?projectId=default")).toBe(false);
    expect(isNavLinkActive("/reviews/abc", "/reviews?projectId=default")).toBe(false);
  });

  it("matches /reviews/new exactly", () => {
    expect(isNavLinkActive("/reviews/new", "/reviews/new")).toBe(true);
    expect(isNavLinkActive("/reviews", "/reviews/new")).toBe(false);
  });

  it("matches create architecture for draft editor routes", () => {
    expect(isNavLinkActive("/architectures/new", "/architectures/new")).toBe(true);
    expect(isNavLinkActive("/architectures/draft-1", "/architectures/new")).toBe(true);
    expect(isNavLinkActive("/architectures", "/architectures/new")).toBe(false);
    expect(isNavLinkActive("/architectures", "/architectures")).toBe(true);
  });

  it("matches exact path or nested segments for other routes", () => {
    expect(isNavLinkActive("/compare", "/compare")).toBe(true);
    expect(isNavLinkActive("/governance/dashboard", "/governance/dashboard")).toBe(true);
    expect(isNavLinkActive("/governance/dashboard/extra", "/governance/dashboard")).toBe(true);
  });

  it("matches tenant settings but not projects recycle bin", () => {
    expect(isNavLinkActive("/settings/tenant", "/settings/tenant")).toBe(true);
    expect(isNavLinkActive("/settings/tenant/recycle-bin", "/settings/tenant")).toBe(false);
    expect(isNavLinkActive("/settings/tenant/recycle-bin", "/settings/tenant/recycle-bin")).toBe(true);
  });
});
