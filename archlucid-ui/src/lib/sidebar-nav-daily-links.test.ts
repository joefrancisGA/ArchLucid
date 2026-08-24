import { describe, expect, it } from "vitest";

import {
  sidebarMoreLinksLabel,
  splitSidebarLinksDailyVsMore,
} from "@/lib/sidebar-nav-daily-links";
import type { NavLinkItem } from "@/lib/nav-config.types";

function link(href: string, label: string): NavLinkItem {
  return {
    href,
    label,
    title: label,
    tier: "extended",
  };
}

describe("splitSidebarLinksDailyVsMore", () => {
  it("returns all links as daily when the group has no daily registry", () => {
    const links = [link("/x", "X")];
    const split = splitSidebarLinksDailyVsMore("pilot", links, "/");

    expect(split.daily).toEqual(links);
    expect(split.more).toEqual([]);
  });

  it("keeps advisory scans in the governance daily strip", () => {
    const links = [
      link("/governance/advisory-scans", "Advisory scans"),
      link("/governance/alert-rules", "Alert rules"),
      link("/governance/alerts", "Alerts"),
      link("/governance/approval-queue", "Approval"),
      link("/governance/findings", "Findings"),
      link("/governance/audit", "Audit"),
    ];
    const split = splitSidebarLinksDailyVsMore("operate-governance", links, "/");

    expect(split.daily.map((row) => row.href)).toEqual([
      "/governance/approval-queue",
      "/governance/findings",
      "/governance/advisory-scans",
      "/governance/alerts",
    ]);
    expect(split.more.map((row) => row.href)).toEqual(["/governance/alert-rules", "/governance/audit"]);
  });

  it("keeps alert rules in more when advisory scans occupies the daily slot", () => {
    const links = [
      link("/governance/alert-rules", "Alert rules"),
      link("/governance/alerts", "Alerts"),
      link("/governance/approval-queue", "Approval"),
      link("/governance/findings", "Findings"),
      link("/governance/audit", "Audit"),
    ];
    const split = splitSidebarLinksDailyVsMore("operate-governance", links, "/");

    expect(split.daily.map((row) => row.href)).toEqual([
      "/governance/approval-queue",
      "/governance/findings",
      "/governance/alerts",
    ]);
    expect(split.more.map((row) => row.href)).toEqual(["/governance/alert-rules", "/governance/audit"]);
  });

  it("splits governance into daily vs more and preserves daily order", () => {
    const links = [
      link("/governance/alerts", "Alerts"),
      link("/governance/approval-queue", "Approval"),
      link("/governance/findings", "Findings"),
      link("/governance/audit", "Audit"),
    ];
    const split = splitSidebarLinksDailyVsMore("operate-governance", links, "/");

    expect(split.daily.map((row) => row.href)).toEqual([
      "/governance/approval-queue",
      "/governance/findings",
      "/governance/alerts",
    ]);
    expect(split.more.map((row) => row.href)).toEqual(["/governance/audit"]);
  });

  it("leads Administration with routine configuration rather than break-glass pages", () => {
    const links = [
      link("/administration", "All settings"),
      link("/administration/users", "Users & roles"),
      link("/administration/billing", "Billing & plans"),
      link("/administration/system-health", "System health"),
      link("/administration/support", "Support"),
      link("/administration/notifications", "Notifications"),
      link("/administration/workspace-settings", "Workspace settings"),
      link("/administration/baseline", "Baseline settings"),
    ];
    const split = splitSidebarLinksDailyVsMore("operator-admin", links, "/");

    expect(split.daily.map((row) => row.href)).toEqual([
      "/administration",
      "/administration/workspace-settings",
      "/administration/users",
      "/administration/notifications",
      "/administration/billing",
      "/administration/system-health",
    ]);
    expect(split.more.map((row) => row.href)).toEqual([
      "/administration/support",
      "/administration/baseline",
    ]);
  });

  it("promotes an active more-link into daily so the route stays visible", () => {
    const links = [
      link("/governance/approval-queue", "Approval"),
      link("/governance/audit", "Audit"),
    ];
    const split = splitSidebarLinksDailyVsMore("operate-governance", links, "/governance/audit");

    expect(split.daily.map((row) => row.href)).toContain("/governance/audit");
    expect(split.more).toEqual([]);
  });

  it("promotes an active more-link when its href includes a fragment anchor", () => {
    const links = [
      link("/governance/policy-packs", "Policy packs"),
      link("/governance/standards-and-rules", "Standards & rules"),
      link("/governance/alert-rules", "Alert rules"),
      link("/governance/recurrence-schedules", "Recurrence schedules"),
    ];
    const split = splitSidebarLinksDailyVsMore("operate-policy", links, "/governance/recurrence-schedules");

    expect(split.daily.map((row) => row.href)).toContain("/governance/recurrence-schedules");
    expect(split.more.map((row) => row.href)).not.toContain("/governance/recurrence-schedules");
  });
});

describe("sidebarMoreLinksLabel", () => {
  it("pluralizes", () => {
    expect(sidebarMoreLinksLabel("Approval", 1)).toBe("1 more in Approval");
    expect(sidebarMoreLinksLabel("Approval", 4)).toBe("4 more in Approval");
  });
});
