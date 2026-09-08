import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { NAV_GROUPS } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config.types";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_GROUP_LABELS, OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { SECURENOW_COMPLIANCE_NAV_GROUP_LABEL } from "@/lib/product-line/securenow-compliance-home-copy";
import {
  SECURENOW_COMPLIANCE_NAV_GROUP_ID,
  SECURENOW_SECURITY_NAV_GROUP_ID,
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

  it("puts Security first with Home, then ARC-AMPE compliance and Infrastructure without Infrastructure overview", () => {
    const rows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      true,
      false,
      { productLine: "security", showVendorInternalNav: true },
    );

    expect(rows[0]?.group.id).toBe(SECURENOW_SECURITY_NAV_GROUP_ID);
    expect(rows[0]?.group.label).toBe(OPERATOR_NAV_GROUP_LABELS.security);
    expect(rows[1]?.group.id).toBe(SECURENOW_COMPLIANCE_NAV_GROUP_ID);
    expect(rows[1]?.group.label).toBe(SECURENOW_COMPLIANCE_NAV_GROUP_LABEL);
    expect(rows[2]?.group.id).toBe("operate-infrastructure");

    const groupIds = rows.map((row) => row.group.id);

    expect(groupIds).not.toContain("pilot");
    expect(groupIds).not.toContain("operate-policy");
    expect(groupIds).not.toContain("operate-governance");
    expect(groupIds).not.toContain("operate-integrations");

    const complianceLinks = rows.find((row) => row.group.id === SECURENOW_COMPLIANCE_NAV_GROUP_ID)?.visibleLinks ?? [];
    const infrastructureLinks = rows.find((row) => row.group.id === "operate-infrastructure")?.visibleLinks ?? [];
    const securityLinks = rows.find((row) => row.group.id === SECURENOW_SECURITY_NAV_GROUP_ID)?.visibleLinks ?? [];

    expect(complianceLinks.map((link) => link.href)).toEqual([
      "/governance/policy-packs",
      "/governance/standards-and-rules",
      "/governance/findings",
      "/governance/audit-evidence",
    ]);
    expect(infrastructureLinks.some((link) => link.href === "/")).toBe(false);
    expect(infrastructureLinks.some((link) => link.href === GOVERNANCE_INFRASTRUCTURE_PATH)).toBe(false);
    expect(infrastructureLinks.some((link) => link.label === OPERATOR_NAV_LINK_LABELS.infrastructureAsk)).toBe(true);
    expect(securityLinks.map((link) => link.href)).toEqual([
      "/",
      "/governance/findings/assigned-to-me",
      "/governance/remediation-factory",
      "/governance/remediation-patterns",
      "/integrations/cloud-connections",
      "/integrations/jira",
      "/integrations/servicenow",
      "/integrations/teams",
    ]);

    const adminLinks = rows.find((row) => row.group.id === "operator-admin")?.visibleLinks ?? [];

    expect(adminLinks.map((link) => link.href)).toContain("/administration/extract-upload");
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
