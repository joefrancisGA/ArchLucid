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

  it("matches create architecture routes under Architectures nav", () => {
    expect(isNavLinkActive("/architectures/new", "/architectures")).toBe(true);
    expect(isNavLinkActive("/architectures/draft-1", "/architectures")).toBe(true);
    expect(isNavLinkActive("/architectures", "/architectures")).toBe(true);
    expect(isNavLinkActive("/reviews", "/architectures")).toBe(false);
  });

  it("matches exact path or nested segments for other routes", () => {
    expect(isNavLinkActive("/insights/compare-two-reviews", "/insights/compare-two-reviews")).toBe(true);
    expect(isNavLinkActive("/governance/dashboard", "/governance/dashboard")).toBe(true);
    expect(isNavLinkActive("/governance/dashboard/extra", "/governance/dashboard")).toBe(true);
  });

  it("matches tenant settings but not projects recycle bin", () => {
    expect(isNavLinkActive("/administration/settings/tenant", "/administration/settings/tenant")).toBe(true);
    expect(isNavLinkActive("/administration/settings/tenant/recycle-bin", "/administration/settings/tenant")).toBe(false);
    expect(isNavLinkActive("/administration/settings/tenant/recycle-bin", "/administration/settings/tenant/recycle-bin")).toBe(true);
  });
});
