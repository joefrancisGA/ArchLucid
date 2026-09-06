import { describe, expect, it } from "vitest";

import {
  sidebarMoreLinksCollapseLabel,
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

  it("splits Insights into daily vs more and preserves daily order", () => {
    const links = [
      link("/insights/patterns", "Pattern library"),
      link("/insights/evidence-graph", "Evidence graph"),
      link("/insights/ask-review-questions", "Ask review questions"),
      link("/insights/search-review-evidence", "Search review evidence"),
      link("/insights/compare-two-reviews", "Compare two reviews"),
      link("/insights/architecture-scorecard", "Architecture scorecard"),
      link("/insights/sponsor-report", "Sponsor report"),
    ];
    const split = splitSidebarLinksDailyVsMore("operate-analysis", links, "/");

    expect(split.daily.map((row) => row.href)).toEqual([
      "/insights/evidence-graph",
      "/insights/ask-review-questions",
      "/insights/search-review-evidence",
      "/insights/sponsor-report",
      "/insights/compare-two-reviews",
    ]);
    expect(split.more.map((row) => row.href)).toEqual([
      "/insights/patterns",
      "/insights/architecture-scorecard",
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

  it("splits Internal ops into daily vs more links", () => {
    const links = [
      link("/internal/health", "Diagnostics dashboard"),
      link("/internal/trial-funnel", "Trial funnel"),
      link("/internal/fleet-llm-cogs", "Fleet LLM COGS"),
      link("/internal/agent-model-catalog", "Agent model catalog"),
      link("/internal/pricing-quote-aging", "Pricing quote follow-up"),
      link("/internal/tenant-health", "Tenant health"),
      link("/internal/tenants", "Tenants"),
    ];
    const split = splitSidebarLinksDailyVsMore("operator-system-admin", links, "/");

    expect(split.daily.map((row) => row.href)).toEqual([
      "/internal/health",
      "/internal/trial-funnel",
      "/internal/fleet-llm-cogs",
      "/internal/agent-model-catalog",
      "/internal/pricing-quote-aging",
    ]);
    expect(split.more.map((row) => row.href)).toEqual(["/internal/tenant-health", "/internal/tenants"]);
  });
});

describe("sidebarMoreLinksLabel", () => {
  it("names the destination cluster in the disclosure label", () => {
    expect(sidebarMoreLinksLabel("operate-governance", 1)).toBe("Show 1 more Approval destination");
    expect(sidebarMoreLinksLabel("operate-governance", 4)).toBe("Show 4 more Approval destinations");
    expect(sidebarMoreLinksLabel("operate-analysis", 5)).toBe("Show 5 more Insights destinations");
  });
});

describe("sidebarMoreLinksCollapseLabel", () => {
  it("names the destination cluster when collapsed", () => {
    expect(sidebarMoreLinksCollapseLabel("operate-governance")).toBe("Show fewer Approval destinations");
    expect(sidebarMoreLinksCollapseLabel("operate-analysis")).toBe("Show fewer Insights destinations");
  });
});
