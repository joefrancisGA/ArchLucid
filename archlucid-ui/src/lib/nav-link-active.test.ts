import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { isNavLinkActive } from "@/lib/nav-link-active";

describe("isNavLinkActive", () => {
  it("matches home only for exact /", () => {
    expect(isNavLinkActive("/", "/")).toBe(true);
    expect(isNavLinkActive("/architecture/reviews", "/")).toBe(false);
  });

  it("matches /architecture/reviews list but not /architecture/reviews/new or review detail", () => {
    expect(isNavLinkActive("/architecture/reviews", "/architecture/reviews")).toBe(true);
    expect(isNavLinkActive("/architecture/reviews/new", "/architecture/reviews")).toBe(false);
    expect(isNavLinkActive("/architecture/reviews/abc", "/architecture/reviews")).toBe(false);
  });

  it("matches /architecture/reviews/new exactly", () => {
    expect(isNavLinkActive("/architecture/reviews/new", "/architecture/reviews/new")).toBe(true);
    expect(isNavLinkActive("/architecture/reviews", "/architecture/reviews/new")).toBe(false);
  });

  it("matches create architecture routes under Architectures nav", () => {
    expect(isNavLinkActive("/architectures/new", "/architectures")).toBe(true);
    expect(isNavLinkActive("/architectures/draft-1", "/architectures")).toBe(true);
    expect(isNavLinkActive("/architectures", "/architectures")).toBe(true);
    expect(isNavLinkActive("/architecture/reviews", "/architectures")).toBe(false);
  });

  it("matches exact path or nested segments for other routes", () => {
    expect(isNavLinkActive("/insights/compare-two-reviews", "/insights/compare-two-reviews")).toBe(true);
    expect(isNavLinkActive(EXECUTIVE_DASHBOARD_HREF, EXECUTIVE_DASHBOARD_HREF)).toBe(true);
    expect(isNavLinkActive(`${EXECUTIVE_DASHBOARD_HREF}/extra`, EXECUTIVE_DASHBOARD_HREF)).toBe(true);
  });

  it("matches tenant settings but not projects recycle bin", () => {
    expect(isNavLinkActive("/administration/tenant", "/administration/tenant")).toBe(true);
    expect(isNavLinkActive("/administration/tenant/recycle-bin", "/administration/tenant")).toBe(false);
    expect(isNavLinkActive("/administration/tenant/recycle-bin", "/administration/tenant/recycle-bin")).toBe(true);
  });

  it("highlights approval queue when viewing approval lineage detail", () => {
    expect(
      isNavLinkActive("/governance/approval-requests/claims-intake-approval-001/lineage", "/governance/approval-queue"),
    ).toBe(true);
    expect(isNavLinkActive("/governance/policy-packs", "/governance/approval-queue")).toBe(false);
  });

  it("does not highlight settings hub for personal account-menu destinations", () => {
    expect(isNavLinkActive("/administration/account-security", "/administration")).toBe(false);
    expect(isNavLinkActive("/administration/preferences", "/administration")).toBe(false);
    expect(isNavLinkActive("/administration/notifications", "/administration")).toBe(false);
    expect(isNavLinkActive("/administration/tenant", "/administration")).toBe(true);
    expect(isNavLinkActive("/administration", "/administration")).toBe(true);
  });
});
