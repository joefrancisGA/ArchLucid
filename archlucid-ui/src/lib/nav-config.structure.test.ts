import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { flattenNavLinks, NAV_GROUPS } from "@/lib/nav-config";

describe("nav-config structure", () => {
  it("does not duplicate hrefs in flattened nav (palette and other consumers key on href)", () => {
    const flat = flattenNavLinks();
    const hrefs = flat.map((link) => link.href);
    const dupes = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);
    const uniqueDupes = [...new Set(dupes)];

    expect(uniqueDupes, `Duplicate hrefs: ${uniqueDupes.join(", ")}`).toEqual([]);
  });

  it("keeps flattenNavLinks length aligned with all group link counts", () => {
    const fromGroups = NAV_GROUPS.reduce((total, group) => total + group.links.length, 0);

    expect(flattenNavLinks().length).toBe(fromGroups);
  });

  it("does not duplicate nav labels within the same group (TB-408)", () => {
    for (const group of NAV_GROUPS) {
      const labels = group.links.map((link) => link.label);
      const dupes = labels.filter((label, index) => labels.indexOf(label) !== index);

      expect(dupes, `${group.id} duplicate labels: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
    }
  });

  it("uses Cloud connections nav label instead of Azure cloud connection (TB-467)", () => {
    const flat = flattenNavLinks();
    const deprecatedLabel = OPERATOR_NAV_LINK_LABELS.azureCloudConnection;
    const cloudConnectionsLink = flat.find((link) => link.href === "/integrations/cloud-connections");

    expect(cloudConnectionsLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.cloudConnections);
    expect(flat.map((link) => link.label)).not.toContain(deprecatedLabel);
  });

  it("sets requiredAuthority on every Governance link (Pilot essentials may omit)", () => {
    const enterprise = NAV_GROUPS.find((group) => group.id === "operate-governance");

    expect(enterprise).toBeDefined();

    for (const link of enterprise!.links) {
      expect(link.requiredAuthority, link.href).toBeDefined();
    }
  });

  it("declares NavShellSurface on every nav group", () => {
    for (const group of NAV_GROUPS) {
      expect(group.surface).toMatch(/^(review-workflow|platform-admin|system-admin)$/);
    }
  });

  it("keeps AdminAuthority rows in tenant, internal admin, or ITSM integration pages only", () => {
    for (const group of NAV_GROUPS) {
      for (const link of group.links) {
        if (link.requiredAuthority === "AdminAuthority") {
          if (group.id === "operate-integrations") {
            expect(["/integrations/jira", "/integrations/servicenow"], link.href).toContain(link.href);
            expect(group.surface).toBe("review-workflow");
          } else {
            expect(["operator-admin", "operator-system-admin"], link.href).toContain(group.id);
            expect(["platform-admin", "system-admin"]).toContain(group.surface);
          }
        }
      }
    }
  });

  it("does not pin collapsed-pilot defaults on platform-admin links", () => {
    const admin = NAV_GROUPS.find((group) => group.id === "operator-admin");

    expect(admin).toBeDefined();

    for (const link of admin!.links) {
      expect(link.defaultVisibleInCollapsedSidebar, link.href).toBeUndefined();
    }
  });

  it("sets requiredAuthority on every Analysis nav link", () => {
    const advanced = NAV_GROUPS.find((group) => group.id === "operate-analysis");

    expect(advanced).toBeDefined();

    for (const link of advanced!.links) {
      expect(link.requiredAuthority, link.href).toBeDefined();
    }
  });

  it("keeps ExecuteAuthority Governance links off essential tier", () => {
    const enterprise = NAV_GROUPS.find((group) => group.id === "operate-governance");

    expect(enterprise).toBeDefined();

    const executeLinks = enterprise!.links.filter((link) => link.requiredAuthority === "ExecuteAuthority");

    expect(executeLinks.length).toBeGreaterThan(0);

    for (const link of executeLinks) {
      expect(link.tier, link.href).not.toBe("essential");
    }
  });

  it("keeps requiredAuthority unset on Pilot essential-tier links", () => {
    const core = NAV_GROUPS.find((group) => group.id === "pilot");

    expect(core).toBeDefined();

    for (const link of core!.links) {
      if (link.tier === "essential") {
        expect(link.requiredAuthority, link.href).toBeUndefined();
      }
    }
  });

  it("keeps ExecuteAuthority Analysis links off essential tier", () => {
    const advanced = NAV_GROUPS.find((group) => group.id === "operate-analysis");

    expect(advanced).toBeDefined();

    const executeLinks = advanced!.links.filter((link) => link.requiredAuthority === "ExecuteAuthority");

    expect(executeLinks.length).toBeGreaterThan(0);

    for (const link of executeLinks) {
      expect(link.tier, link.href).not.toBe("essential");
    }
  });

  it("keeps buyer-polished operate group membership aligned", () => {
    const analysisHrefs = NAV_GROUPS.find((group) => group.id === "operate-analysis")!.links.map((link) => link.href);
    const governanceHrefs = NAV_GROUPS.find((group) => group.id === "operate-governance")!.links.map((link) => link.href);
    const reportsHrefs = NAV_GROUPS.find((group) => group.id === "operate-reports")!.links.map((link) => link.href);
    const integrationsHrefs = NAV_GROUPS.find((group) => group.id === "operate-integrations")!.links.map((link) => link.href);
    const systemAdminHrefs = NAV_GROUPS.find((group) => group.id === "operator-system-admin")!.links.map((link) => link.href);

    expect(analysisHrefs).toEqual(["/graph", "/ask", "/search", "/compare", "/evolution-review", "/advisory"]);
    expect(governanceHrefs).toEqual([
      "/governance",
      "/governance/findings",
      "/governance/risk-exceptions",
      "/governance/policy-packs",
      "/governance/resolution",
      "/governance/decision-register",
      "/governance/audit",
      "/governance/alerts",
      "/governance/recurrence-schedules",
      "/governance/first-30-days",
    ]);
    expect(reportsHrefs).toEqual(["/scorecard", "/value-report"]);
    expect(integrationsHrefs).toEqual([
      "/integrations/readiness",
      "/integrations/cloud-connections",
      "/integrations/jira",
      "/integrations/servicenow",
      "/integrations/teams",
      "/integrations/slack",
      "/integrations/webhooks",
    ]);
    expect(systemAdminHrefs).toContain("/admin/rag-health");
    expect(systemAdminHrefs).toContain("/replay");
    expect(systemAdminHrefs).not.toContain("/advisory");
    expect(systemAdminHrefs).not.toContain("/settings/tenant");
    expect(systemAdminHrefs).not.toContain("/workspace/security-trust");

    const adminHrefs = NAV_GROUPS.find((group) => group.id === "operator-admin")!.links.map((link) => link.href);

    expect(adminHrefs).toContain("/settings/security-trust");
    expect(adminHrefs).toContain("/settings/users");
    expect(adminHrefs).toContain("/settings/support");
    expect(adminHrefs).toContain("/settings/ai-usage");
    expect(adminHrefs).not.toContain("/governance/recurrence-schedules");
  });

  it("keeps integrations nav hrefs under /integrations/* (TB-407)", () => {
    const integrations = NAV_GROUPS.find((group) => group.id === "operate-integrations");

    expect(integrations).toBeDefined();

    for (const link of integrations!.links) {
      expect(
        link.href === "/integrations" || link.href.startsWith("/integrations/"),
        link.href,
      ).toBe(true);
    }
  });

  it("keeps administration nav hrefs under /settings/* (TB-406)", () => {
    const admin = NAV_GROUPS.find((group) => group.id === "operator-admin");

    expect(admin).toBeDefined();

    for (const link of admin!.links) {
      expect(link.href.startsWith("/settings/") || link.href === "/settings", link.href).toBe(true);
    }
  });

  it("keeps governance nav hrefs under /governance/* (TB-405)", () => {
    const governance = NAV_GROUPS.find((group) => group.id === "operate-governance");

    expect(governance).toBeDefined();

    for (const link of governance!.links) {
      expect(
        link.href === "/governance" || link.href.startsWith("/governance/"),
        link.href,
      ).toBe(true);
    }
  });
});
