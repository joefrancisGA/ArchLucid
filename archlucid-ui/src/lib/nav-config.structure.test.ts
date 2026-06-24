import { describe, expect, it } from "vitest";

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

  it("keeps AdminAuthority rows in tenant or internal admin groups only", () => {
    for (const group of NAV_GROUPS) {
      for (const link of group.links) {
        if (link.requiredAuthority === "AdminAuthority") {
          expect(["operator-admin", "operator-system-admin"], link.href).toContain(group.id);
          expect(["platform-admin", "system-admin"]).toContain(group.surface);
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

    expect(executeLinks.length).toBe(0);
  });

  it("keeps buyer-polished operate group membership aligned", () => {
    const analysisHrefs = NAV_GROUPS.find((group) => group.id === "operate-analysis")!.links.map((link) => link.href);
    const governanceHrefs = NAV_GROUPS.find((group) => group.id === "operate-governance")!.links.map((link) => link.href);
    const reportsHrefs = NAV_GROUPS.find((group) => group.id === "operate-reports")!.links.map((link) => link.href);
    const integrationsHrefs = NAV_GROUPS.find((group) => group.id === "operate-integrations")!.links.map((link) => link.href);
    const systemAdminHrefs = NAV_GROUPS.find((group) => group.id === "operator-system-admin")!.links.map((link) => link.href);

    expect(analysisHrefs).toEqual(["/ask", "/search", "/compare"]);
    expect(governanceHrefs).toEqual([
      "/governance",
      "/governance/findings",
      "/governance/risk-exceptions",
      "/policy-packs",
      "/governance/decision-register",
      "/audit",
      "/alerts",
    ]);
    expect(reportsHrefs).toEqual(["/scorecard", "/value-report", "/governance/first-30-days"]);
    expect(integrationsHrefs).toEqual([
      "/integrations/operations",
      "/settings/cloud-connections",
      "/integrations/webhooks",
      "/integrations/teams",
    ]);
    expect(systemAdminHrefs).toContain("/admin/rag-health");
    expect(systemAdminHrefs).toContain("/replay");
    expect(systemAdminHrefs).toContain("/advisory");
    expect(systemAdminHrefs).not.toContain("/settings/tenant");
  });
});
