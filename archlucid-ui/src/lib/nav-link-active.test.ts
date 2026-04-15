import { describe, expect, it } from "vitest";

import { isNavLinkActive } from "@/lib/nav-link-active";

describe("isNavLinkActive", () => {
  it("matches home only for exact /", () => {
    expect(isNavLinkActive("/", "/")).toBe(true);
    expect(isNavLinkActive("/runs", "/")).toBe(false);
  });

  it("matches /runs list but not /runs/new or run detail", () => {
    expect(isNavLinkActive("/runs", "/runs?projectId=default")).toBe(true);
    expect(isNavLinkActive("/runs/new", "/runs?projectId=default")).toBe(false);
    expect(isNavLinkActive("/runs/abc", "/runs?projectId=default")).toBe(false);
  });

  it("matches /runs/new exactly", () => {
    expect(isNavLinkActive("/runs/new", "/runs/new")).toBe(true);
    expect(isNavLinkActive("/runs", "/runs/new")).toBe(false);
  });

  it("matches exact path or nested segments for other routes", () => {
    expect(isNavLinkActive("/compare", "/compare")).toBe(true);
    expect(isNavLinkActive("/governance/dashboard", "/governance/dashboard")).toBe(true);
    expect(isNavLinkActive("/governance/dashboard/extra", "/governance/dashboard")).toBe(true);
  });
});
