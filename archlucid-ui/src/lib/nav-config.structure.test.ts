import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { flattenNavLinks, NAV_GROUPS } from "@/lib/nav-config";
import { NAV_ROUTE_NAMESPACE_EXCEPTIONS } from "@/lib/nav-route-namespace-exceptions";

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

  it("does not duplicate icons within the same nav group", () => {
    for (const group of NAV_GROUPS) {
      const iconKeys = group.links.map((link) => {
        const icon = link.icon as { displayName?: string; name?: string };

        return icon.displayName ?? icon.name ?? link.href;
      });
      const dupes = iconKeys.filter((key, index) => iconKeys.indexOf(key) !== index);

      expect(dupes, `${group.id} duplicate icons: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
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
            expect(["/integrations/jira", "/integrations/azure-boards", "/integrations/servicenow"], link.href).toContain(link.href);
            expect(group.surface).toBe("review-workflow");
          } else {
            expect(["operator-admin", "operator-system-admin"], group.id).toContain(group.id);
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

  it("labels pilot nav group Architecture", () => {
    const pilot = NAV_GROUPS.find((group) => group.id === "pilot");

    expect(pilot?.label).toBe("Architecture");
    expect(pilot?.label).not.toBe("Review work");
  });

  it("labels operate-analysis nav group Insights (TB-525)", () => {
    const analysis = NAV_GROUPS.find((group) => group.id === "operate-analysis");

    expect(analysis?.label).toBe("Insights");
    expect(analysis?.caption).toBe("Explore evidence, findings, and decisions across reviews.");
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

    // Approval queue (/governance) moved to ReadAuthority (browsing only; approve/reject/promote/activate stay
    // Execute-gated in the page itself) — Governance currently has no ExecuteAuthority nav links, so this loop is a
    // no-op regression guard for future additions.
    for (const link of enterprise!.links) {
      if (link.requiredAuthority === "ExecuteAuthority") {
        expect(link.tier, link.href).not.toBe("essential");
      }
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

    // Impact preview moved to ReadAuthority (browsing only; Simulate itself stays Execute-gated in the UI/API) —
    // Insights currently has no ExecuteAuthority links, so this loop is a no-op regression guard for future additions.
    for (const link of advanced!.links) {
      if (link.requiredAuthority === "ExecuteAuthority") {
        expect(link.tier, link.href).not.toBe("essential");
      }
    }
  });

  it("keeps buyer-polished operate group membership aligned", () => {
    const analysisHrefs = NAV_GROUPS.find((group) => group.id === "operate-analysis")!.links.map((link) => link.href);
    const governanceHrefs = NAV_GROUPS.find((group) => group.id === "operate-governance")!.links.map((link) => link.href);
    const reportsHrefs = NAV_GROUPS.find((group) => group.id === "operate-reports")!.links.map((link) => link.href);
    const integrationsHrefs = NAV_GROUPS.find((group) => group.id === "operate-integrations")!.links.map((link) => link.href);
    const systemAdminHrefs = NAV_GROUPS.find((group) => group.id === "operator-system-admin")!.links.map((link) => link.href);

    expect(analysisHrefs).toEqual([
      "/graph",
      "/ask",
      "/search",
      "/compare",
      "/evolution-review",
      "/scorecard",
      "/patterns",
    ]);
    const architectAdvancedHrefs = NAV_GROUPS.find((group) => group.id === "operate-architect-advanced")!.links.map(
      (link) => link.href,
    );

    expect(architectAdvancedHrefs).toEqual([
      "/product-learning",
      "/planning",
    ]);
    expect(governanceHrefs).toEqual([
      "/governance",
      "/governance/findings",
      "/governance/risk-exceptions",
      "/governance/policy-packs",
      "/governance/resolution",
      "/governance/decision-register",
      "/signed-records",
      "/advisory",
      "/governance/audit",
      "/governance/alerts",
      "/governance/alert-rules",
      "/governance/recurrence-schedules",
      "/governance/first-30-days",
    ]);
    expect(reportsHrefs).toEqual([
      "/value-report",
      "/value-report/pilot",
      "/value-report/roi",
      "/digests",
    ]);
    expect(integrationsHrefs).toEqual([
      "/integrations/cloud-connections",
      "/integrations/jira",
      "/integrations/azure-boards",
      "/integrations/servicenow",
      "/integrations/teams",
      "/integrations/slack",
      "/integrations/webhooks",
    ]);
    expect(systemAdminHrefs).toContain("/admin/rag-health");
    expect(systemAdminHrefs).toContain("/admin/deployment-status");
    expect(systemAdminHrefs).toContain("/replay");
    expect(systemAdminHrefs).not.toContain("/health");
    expect(systemAdminHrefs).not.toContain("/advisory");
    expect(systemAdminHrefs).not.toContain("/settings/tenant");
    expect(systemAdminHrefs).not.toContain("/workspace/security-trust");
    // Tenant-tier-gated features (RequiresCommercialTenantTier) moved out of the employee-only,
    // showSystemAdministrationNav-gated group so real customers can discover them (nav placement audit, 2026-07-05).
    expect(systemAdminHrefs).toContain("/internal-operations/recommendation-learning");
    expect(systemAdminHrefs).not.toContain("/product-learning");
    expect(systemAdminHrefs).not.toContain("/planning");
    expect(systemAdminHrefs).not.toContain("/digests");
    expect(systemAdminHrefs).not.toContain("/value-report/pilot");
    expect(systemAdminHrefs).not.toContain("/value-report/roi");
    expect(systemAdminHrefs).not.toContain("/settings/identity-providers");
    expect(systemAdminHrefs).not.toContain("/settings/identity/sso-wizard");
    expect(systemAdminHrefs).not.toContain("/settings/api-keys");
    expect(systemAdminHrefs).not.toContain("/settings/scim-provisioning");

    const adminHrefs = NAV_GROUPS.find((group) => group.id === "operator-admin")!.links.map((link) => link.href);

    expect(adminHrefs).toContain("/settings/security-trust");
    expect(adminHrefs).toContain("/settings/users");
    expect(adminHrefs).not.toContain("/settings/roles");
    expect(adminHrefs).toContain("/settings/support");
    expect(adminHrefs).toContain("/settings/ai-usage");
    expect(adminHrefs).toContain("/integrations/readiness");
    expect(adminHrefs).toContain("/health");
    expect(adminHrefs).toContain("/settings/identity-providers");
    expect(adminHrefs).toContain("/settings/identity/sso-wizard");
    expect(adminHrefs).toContain("/settings/api-keys");
    expect(adminHrefs).toContain("/settings/scim-provisioning");
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

    const adminNamespaceExceptions = new Set(
      NAV_ROUTE_NAMESPACE_EXCEPTIONS
        .filter((row) => row.navGroupId === "operator-admin")
        .map((row) => row.href),
    );

    for (const link of admin!.links) {
      const isSettingsHref = link.href.startsWith("/settings/") || link.href === "/settings";

      expect(isSettingsHref || adminNamespaceExceptions.has(link.href), link.href).toBe(true);
    }
  });

  it("keeps governance nav hrefs under /governance/* (TB-405)", () => {
    const governance = NAV_GROUPS.find((group) => group.id === "operate-governance");
    const governanceNamespaceExceptions = new Set(["/advisory", "/signed-records"]);

    expect(governance).toBeDefined();

    for (const link of governance!.links) {
      expect(
        link.href === "/governance"
          || link.href.startsWith("/governance/")
          || governanceNamespaceExceptions.has(link.href),
        link.href,
      ).toBe(true);
    }
  });

  it("does not use operator persona in customer-facing nav labels or subtitles", () => {
    for (const group of NAV_GROUPS) {
      if (group.id === "operator-system-admin") {
        continue;
      }

      expect(group.label.toLowerCase()).not.toMatch(/\boperator\b/);

      if (group.caption !== undefined) {
        expect(group.caption.toLowerCase()).not.toMatch(/\boperator\b/);
      }

      for (const link of group.links) {
        expect(link.label.toLowerCase(), `${group.id}:${link.href}:label`).not.toMatch(/\boperator\b/);

        if (link.title !== undefined) {
          expect(link.title.toLowerCase(), `${group.id}:${link.href}:title`).not.toMatch(/\boperator\b/);
        }
      }
    }
  });
});
