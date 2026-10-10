import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { NAV_GROUPS } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config.types";
import {
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import {
  SECURENOW_COMPLIANCE_NAV_GROUP_ID,
  SECURENOW_DATA_SOURCES_NAV_GROUP_ID,
  SECURENOW_ENVIRONMENT_NAV_GROUP_ID,
  SECURENOW_FINDINGS_NAV_GROUP_ID,
  SECURENOW_INTEGRATION_NAV_GROUP_ID,
  SECURENOW_AZURE_CONNECTIONS_NAV_LABEL,
  SECURENOW_REMEDIATION_NAV_GROUP_ID,
} from "@/lib/product-line/securenow-nav-reshape";

function navLinkIconKey(link: NavLinkItem): string {
  const icon = link.icon as { displayName?: string; name?: string };

  return icon.displayName ?? icon.name ?? link.href;
}

function collectDuplicateNavIconKeys(links: readonly NavLinkItem[]): string[] {
  const iconKeys = links.map(navLinkIconKey);
  const dupes = iconKeys.filter((key, index) => iconKeys.indexOf(key) !== index);

  return [...new Set(dupes)];
}

function listSecureNowSidebarLinks(
  rank: number,
  options: { readonly showVendorInternalNav: boolean },
): NavLinkItem[] {
  const rows = listNavGroupsVisibleInOperatorShell(NAV_GROUPS, rank, "all", true, false, {
    productLine: "security",
    showVendorInternalNav: options.showVendorInternalNav,
  });

  return rows.flatMap((row) => row.visibleLinks);
}

describe("filterNavGroupsForProductLine (Security shell)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("organizes SecureNow around the security architect workflow", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );

    expect(rows.map((row) => row.group.id)).toEqual([
      "securenow-home",
      SECURENOW_FINDINGS_NAV_GROUP_ID,
      SECURENOW_ENVIRONMENT_NAV_GROUP_ID,
      SECURENOW_REMEDIATION_NAV_GROUP_ID,
      SECURENOW_COMPLIANCE_NAV_GROUP_ID,
      SECURENOW_DATA_SOURCES_NAV_GROUP_ID,
      SECURENOW_INTEGRATION_NAV_GROUP_ID,
      "operator-admin",
    ]);

    const groupIds = rows.map((row) => row.group.id);

    expect(groupIds).not.toContain("pilot");
    expect(groupIds).not.toContain("operate-policy");
    expect(groupIds).not.toContain("operate-governance");
    expect(groupIds).not.toContain("operate-integrations");

    const complianceLinks = rows.find((row) => row.group.id === SECURENOW_COMPLIANCE_NAV_GROUP_ID)?.visibleLinks ?? [];
    const integrationLinks = rows.find((row) => row.group.id === SECURENOW_INTEGRATION_NAV_GROUP_ID)?.visibleLinks ?? [];

    const homeLinks = rows.find((row) => row.group.id === "securenow-home")?.visibleLinks ?? [];
    const findingsLinks = rows.find((row) => row.group.id === SECURENOW_FINDINGS_NAV_GROUP_ID)?.visibleLinks ?? [];
    const environmentLinks = rows.find((row) => row.group.id === SECURENOW_ENVIRONMENT_NAV_GROUP_ID)?.visibleLinks ?? [];
    const remediationLinks = rows.find((row) => row.group.id === SECURENOW_REMEDIATION_NAV_GROUP_ID)?.visibleLinks ?? [];
    const dataSourceLinks = rows.find((row) => row.group.id === SECURENOW_DATA_SOURCES_NAV_GROUP_ID)?.visibleLinks ?? [];

    expect(homeLinks.map((link) => link.href)).toEqual(["/"]);
    expect(findingsLinks.map((link) => link.href)).toEqual([
      "/security/assigned-to-me",
      "/compliance/findings",
    ]);
    expect(environmentLinks.map((link) => link.href)).toEqual([
      "/infrastructure/resources",
      "/infrastructure/diagrams",
      "/infrastructure/diagram-reconcile",
      "/infrastructure/snapshots-drift",
      "/infrastructure/ask",
      "/infrastructure/terraform",
    ]);
    expect(remediationLinks.map((link) => link.href)).toEqual([
      "/security/remediation-factory",
      "/security/remediation-patterns",
      "/security/remediation-instances",
    ]);
    expect(complianceLinks.map((link) => link.href)).toEqual([
      "/compliance/policy-packs",
      "/compliance/standards-and-rules",
      "/compliance/audit-evidence",
    ]);
    expect(dataSourceLinks.map((link) => link.href)).toEqual([
      "/integrations/cloud-connections",
      "/infrastructure/declared-connections",
      "/administration/connection-status",
      "/infrastructure/extract-upload",
    ]);
    expect(environmentLinks.some((link) => link.label === "Ask about your environment")).toBe(true);
    expect(environmentLinks.some((link) => link.href === SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH)).toBe(true);
    expect(environmentLinks.some((link) => link.href === "/governance/infrastructure/diagrams")).toBe(false);
    expect(dataSourceLinks.some((link) => link.href === "/governance/infrastructure/extract-upload")).toBe(false);
    expect(environmentLinks.some((link) => link.href === "/governance/infrastructure/drift")).toBe(false);
    expect(dataSourceLinks.some((link) => link.href === "/governance/infrastructure/declared-connections")).toBe(false);
    expect(integrationLinks.map((link) => link.href)).toEqual([
      "/integrations/jira",
      "/integrations/servicenow",
      "/integrations/teams",
    ]);
    expect(dataSourceLinks.find((link) => link.href === "/integrations/cloud-connections")?.label).toBe(
      SECURENOW_AZURE_CONNECTIONS_NAV_LABEL,
    );
    expect(findingsLinks.map((link) => link.label)).toEqual(["My findings", "All findings"]);
    expect(remediationLinks.map((link) => link.label)).toEqual([
      "Priorities & waves",
      "Fix playbooks",
      "Remediation tracker",
    ]);
    expect(environmentLinks.map((link) => link.label)).toEqual([
      "Resources",
      "Diagrams",
      "Diagram reconciliation",
      "Changes & drift",
      "Ask about your environment",
      "Terraform mapping",
    ]);
    expect(complianceLinks.map((link) => link.label)).toEqual([
      "Frameworks",
      "Effective rules",
      "Audit evidence",
    ]);
    expect(dataSourceLinks.map((link) => link.label)).toEqual([
      "Azure connections",
      "Declared connections",
      "Connection status",
      "Manual upload",
    ]);
    expect(rows.map((row) => row.group.caption)).toEqual([
      undefined,
      "What needs attention, and who owns it.",
      "What you have and how it connects.",
      "What to fix first, and whether it worked.",
      "Frameworks, effective rules, and audit evidence.",
      "Where SecureNow's evidence comes from.",
      "Where findings and fixes are sent.",
      "Settings, billing, users, inventory upload, connector health, and support.",
    ]);
    expect(
      rows
        .flatMap((row) => row.visibleLinks)
        .some((link) => /review|architecture risk|draft-only|honesty|Alt\+/i.test(link.title)),
    ).toBe(false);
    expect(
      rows
        .flatMap((row) => row.visibleLinks)
        .find((link) => link.href === "/security/remediation-factory")?.title,
    ).toBe("Rank fixes by risk reduced and group them into waves.");

    const adminLinks = rows.find((row) => row.group.id === "operator-admin")?.visibleLinks ?? [];

    expect(adminLinks.map((link) => link.href)).not.toContain("/administration/extract-upload");
    expect(adminLinks.map((link) => link.href)).not.toContain("/administration/support");
    expect(adminLinks.map((link) => link.href)).not.toContain("/administration/connection-status");
  });

  it("merges Internal destinations under Administration instead of a separate Internal group", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.PlatformInternalOperationsAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );
    const groupIds = rows.map((row) => row.group.id);

    expect(groupIds).not.toContain("operator-system-admin");
    expect(groupIds).toContain("operator-admin");

    const adminLinks = rows.find((row) => row.group.id === "operator-admin")?.visibleLinks ?? [];
    const adminHrefs = adminLinks.map((link) => link.href);

    expect(adminHrefs).toContain("/administration/users");
    expect(adminHrefs).toContain("/internal/health");
    expect(adminHrefs).toContain("/internal/configuration");
    expect(adminHrefs).toContain("/internal/tenants");
    expect(adminHrefs).not.toContain("/internal/product-line");
    expect(adminHrefs).not.toContain("/internal/deployment-status");
    expect(adminHrefs).not.toContain("/internal/trial-funnel");
  });

  it("keeps SecureNow sidebar nav icons distinct for tenant admins", () => {
    const links = listSecureNowSidebarLinks(AUTHORITY_RANK.AdminAuthority, {
      showVendorInternalNav: true,
    });
    const dupes = collectDuplicateNavIconKeys(links);

    expect(dupes, `Duplicate SecureNow sidebar icons: ${dupes.join(", ")}`).toEqual([]);
  });

  it("keeps SecureNow sidebar nav icons distinct when Internal links merge under Administration", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const links = listSecureNowSidebarLinks(AUTHORITY_RANK.PlatformInternalOperationsAuthority, {
      showVendorInternalNav: true,
    });
    const dupes = collectDuplicateNavIconKeys(links);

    expect(dupes, `Duplicate SecureNow sidebar icons: ${dupes.join(", ")}`).toEqual([]);
  });
});
